import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { gamesRepository } from "../index";
import type { Game } from "../types";

export function useGame(id: string | undefined): Game | null | undefined {
  const db = useSQLiteContext();
  const { revisions } = useDataRefresh();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const rev = revisions["domination.games"] ?? 0;

  useEffect(() => {
    if (!id) {
      setGame(null);
      return;
    }
    let cancelled = false;
    gamesRepository.getGame(db, id).then((g) => {
      if (!cancelled) setGame(g);
    });
    return () => {
      cancelled = true;
    };
  }, [db, id, rev]);

  return game;
}
