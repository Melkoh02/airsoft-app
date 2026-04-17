import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { gamesRepository } from "../index";
import type { Game } from "../types";

export function useGames(): Game[] | null {
  const db = useSQLiteContext();
  const { revisions } = useDataRefresh();
  const [games, setGames] = useState<Game[] | null>(null);
  const rev = revisions["domination.games"] ?? 0;

  useEffect(() => {
    let cancelled = false;
    gamesRepository.listGames(db).then((rows) => {
      if (!cancelled) setGames(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [db, rev]);

  return games;
}
