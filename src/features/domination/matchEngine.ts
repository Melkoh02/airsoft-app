import type { Game, RoundResult } from "./types";

export const NEUTRAL_OWNER = "__neutral__";

export type MatchStatus =
  | "idle"
  | "countdown"
  | "active"
  | "paused"
  | "roundEnded"
  | "completed"
  | "aborted";

export type MatchEngineState = {
  status: MatchStatus;
  currentRound: number;
  countdownStartedAt: number | null;
  currentOwner: string;
  currentSince: number | null;
  accumulated: Record<string, number>;
  completedRounds: RoundResult[];
};

export type MatchEngineAction =
  | { type: "startRound"; at: number }
  | { type: "countdownDone"; at: number }
  | { type: "press"; teamId: string; at: number }
  | { type: "pause"; at: number }
  | { type: "resume"; at: number }
  | { type: "endRound"; at: number }
  | { type: "nextRound"; at: number }
  | { type: "abort"; at: number };

export function initialMatchState(): MatchEngineState {
  return {
    status: "idle",
    currentRound: 0,
    countdownStartedAt: null,
    currentOwner: NEUTRAL_OWNER,
    currentSince: null,
    accumulated: {},
    completedRounds: [],
  };
}

function flushAccumulator(state: MatchEngineState, now: number): MatchEngineState {
  if (state.currentSince === null) return state;
  const delta = Math.max(0, now - state.currentSince);
  const key = state.currentOwner;
  return {
    ...state,
    accumulated: {
      ...state.accumulated,
      [key]: (state.accumulated[key] ?? 0) + delta,
    },
    currentSince: now,
  };
}

export function roundElapsedMs(state: MatchEngineState, now: number): number {
  let total = 0;
  for (const key of Object.keys(state.accumulated)) total += state.accumulated[key];
  if (state.currentSince !== null) total += Math.max(0, now - state.currentSince);
  return total;
}

export function teamAccumulatedMs(state: MatchEngineState, teamId: string, now: number): number {
  const base = state.accumulated[teamId] ?? 0;
  if (state.currentOwner === teamId && state.currentSince !== null) {
    return base + Math.max(0, now - state.currentSince);
  }
  return base;
}

export function neutralAccumulatedMs(state: MatchEngineState, now: number): number {
  const base = state.accumulated[NEUTRAL_OWNER] ?? 0;
  if (state.currentOwner === NEUTRAL_OWNER && state.currentSince !== null) {
    return base + Math.max(0, now - state.currentSince);
  }
  return base;
}

function makeRoundResult(state: MatchEngineState, game: Game): RoundResult {
  const [teamA, teamB] = game.teams;
  const aMs = state.accumulated[teamA.id] ?? 0;
  const bMs = state.accumulated[teamB.id] ?? 0;
  const neutralMs = state.accumulated[NEUTRAL_OWNER] ?? 0;
  const winner = aMs > bMs ? teamA.id : bMs > aMs ? teamB.id : null;
  return {
    index: state.currentRound,
    durationMs: game.roundDurationMs,
    dominationMsByTeam: { [teamA.id]: aMs, [teamB.id]: bMs },
    neutralMs,
    winnerTeamId: winner,
  };
}

export function matchReducer(
  state: MatchEngineState,
  action: MatchEngineAction,
  game: Game,
): MatchEngineState {
  switch (action.type) {
    case "startRound": {
      if (state.status !== "idle" && state.status !== "roundEnded") return state;
      return {
        ...state,
        status: "countdown",
        countdownStartedAt: action.at,
        currentOwner: NEUTRAL_OWNER,
        currentSince: null,
        accumulated: {},
      };
    }
    case "countdownDone": {
      if (state.status !== "countdown") return state;
      return { ...state, status: "active", currentSince: action.at };
    }
    case "press": {
      if (state.status !== "active") return state;
      if (state.currentOwner === action.teamId) return state;
      const flushed = flushAccumulator(state, action.at);
      return { ...flushed, currentOwner: action.teamId, currentSince: action.at };
    }
    case "pause": {
      if (state.status !== "active") return state;
      const flushed = flushAccumulator(state, action.at);
      return { ...flushed, status: "paused", currentSince: null };
    }
    case "resume": {
      if (state.status !== "paused") return state;
      return { ...state, status: "active", currentSince: action.at };
    }
    case "endRound": {
      if (state.status !== "active" && state.status !== "paused") return state;
      const flushed = flushAccumulator(state, action.at);
      const result = makeRoundResult(flushed, game);
      return {
        ...flushed,
        status: "roundEnded",
        currentSince: null,
        completedRounds: [...flushed.completedRounds, result],
      };
    }
    case "nextRound": {
      if (state.status !== "roundEnded") return state;
      if (state.currentRound + 1 >= game.roundCount) {
        return { ...state, status: "completed" };
      }
      return {
        ...state,
        currentRound: state.currentRound + 1,
        status: "countdown",
        countdownStartedAt: action.at,
        currentOwner: NEUTRAL_OWNER,
        currentSince: null,
        accumulated: {},
      };
    }
    case "abort": {
      if (state.status === "completed" || state.status === "aborted") return state;
      return { ...state, status: "aborted", currentSince: null };
    }
  }
}
