import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { matchesRepository } from "../index";
import type { Match } from "../types";

export function useGlobalMatches(limit?: number): Match[] | null {
  const db = useSQLiteContext();
  const { revisions } = useDataRefresh();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const rev = revisions["domination.matches"] ?? 0;

  useEffect(() => {
    let cancelled = false;
    const fetcher =
      limit !== undefined
        ? matchesRepository.listRecent(db, limit)
        : matchesRepository.listAllCompleted(db);
    fetcher.then((rows) => {
      if (!cancelled) setMatches(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [db, limit, rev]);

  return matches;
}
