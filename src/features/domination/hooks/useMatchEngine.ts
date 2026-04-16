import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { matchesRepository } from "../index";
import {
  initialMatchState,
  matchReducer,
  roundElapsedMs,
  type MatchEngineAction,
  type MatchEngineState,
} from "../matchEngine";
import type { Game, Match } from "../types";

type Options = {
  game: Game;
  onCompleted?: (matchId: string) => void;
  onAborted?: (matchId: string) => void;
};

type DispatchInput =
  | { type: "startRound" }
  | { type: "countdownDone" }
  | { type: "press"; teamId: string; at?: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "endRound" }
  | { type: "nextRound" }
  | { type: "abort" };

export type UseMatchEngineResult = {
  state: MatchEngineState;
  match: Match | null;
  dispatch: (input: DispatchInput) => void;
  tick: number;
};

export function useMatchEngine({ game, onCompleted, onAborted }: Options): UseMatchEngineResult {
  const db = useSQLiteContext();
  const { invalidate } = useDataRefresh();

  const [match, setMatch] = useState<Match | null>(null);
  const [state, dispatchRaw] = useReducer(
    (s: MatchEngineState, a: MatchEngineAction) => matchReducer(s, a, game),
    undefined,
    initialMatchState,
  );
  const [tick, setTick] = useState(0);

  const dispatch = useCallback((input: DispatchInput) => {
    const at =
      "at" in input && typeof (input as { at?: number }).at === "number"
        ? (input as { at: number }).at
        : Date.now();
    dispatchRaw({ ...input, at } as MatchEngineAction);
  }, []);

  useEffect(() => {
    let cancelled = false;
    matchesRepository.startMatch(db, game.id).then((m) => {
      if (!cancelled) setMatch(m);
    });
    return () => {
      cancelled = true;
    };
  }, [db, game.id]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  // Auto-transition countdown → active
  useEffect(() => {
    if (state.status !== "countdown" || state.countdownStartedAt === null) return;
    const elapsed = Date.now() - state.countdownStartedAt;
    if (elapsed >= game.countdownDurationMs) {
      dispatch({ type: "countdownDone" });
    }
  }, [tick, state.status, state.countdownStartedAt, game.countdownDurationMs, dispatch]);

  // Auto-transition active → roundEnded when round time expires
  useEffect(() => {
    if (state.status !== "active") return;
    const elapsed = roundElapsedMs(state, Date.now());
    if (elapsed >= game.roundDurationMs) {
      dispatch({ type: "endRound" });
    }
  }, [tick, state, game.roundDurationMs, dispatch]);

  // Persist completed rounds to DB (incrementally)
  const persistedCountRef = useRef(0);
  useEffect(() => {
    if (!match) return;
    const pending = state.completedRounds.slice(persistedCountRef.current);
    if (pending.length === 0) return;
    persistedCountRef.current = state.completedRounds.length;
    pending.forEach((round) => {
      matchesRepository.appendRound(db, match.id, round).catch(() => {});
    });
  }, [state.completedRounds, match, db]);

  // Finalize match on completed / aborted
  const finalizedRef = useRef(false);
  useEffect(() => {
    if (!match || finalizedRef.current) return;
    if (state.status === "completed") {
      finalizedRef.current = true;
      matchesRepository
        .completeMatch(db, match.id)
        .then(() => {
          invalidate("domination.matches");
          onCompleted?.(match.id);
        })
        .catch(() => {});
    } else if (state.status === "aborted") {
      finalizedRef.current = true;
      matchesRepository
        .abortMatch(db, match.id)
        .then(() => {
          invalidate("domination.matches");
          onAborted?.(match.id);
        })
        .catch(() => {});
    }
  }, [state.status, match, db, invalidate, onCompleted, onAborted]);

  return { state, dispatch, match, tick };
}
