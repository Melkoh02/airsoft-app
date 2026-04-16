import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { matchesRepository } from "../index";
import type { Match } from "../types";

export function useMatches(gameId: string | undefined): Match[] | null {
  const db = useSQLiteContext();
  const { revisions } = useDataRefresh();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const rev = revisions["domination.matches"] ?? 0;

  useEffect(() => {
    if (!gameId) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    matchesRepository.listMatchesForGame(db, gameId).then((m) => {
      if (!cancelled) setMatches(m);
    });
    return () => {
      cancelled = true;
    };
  }, [db, gameId, rev]);

  return matches;
}

export function useMatch(matchId: string | undefined): Match | null | undefined {
  const db = useSQLiteContext();
  const { revisions } = useDataRefresh();
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const rev = revisions["domination.matches"] ?? 0;

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      return;
    }
    let cancelled = false;
    matchesRepository.getMatch(db, matchId).then((m) => {
      if (!cancelled) setMatch(m);
    });
    return () => {
      cancelled = true;
    };
  }, [db, matchId, rev]);

  return match;
}
