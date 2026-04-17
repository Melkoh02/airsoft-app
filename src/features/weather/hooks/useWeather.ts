import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { useSQLiteContext } from "expo-sqlite";
import type { Units } from "@/providers/SettingsProvider";
import * as service from "../service";
import type { WeatherData } from "../types";

export type WeatherStatus = "idle" | "permissionNeeded" | "denied" | "loading" | "ready" | "error";

export type UseWeatherResult = {
  status: WeatherStatus;
  data: WeatherData | null;
  isStale: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  request: () => Promise<void>;
};

export function useWeather(units: Units): UseWeatherResult {
  const db = useSQLiteContext();
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<WeatherStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const unitsRef = useRef<Units>(units);

  const fetchAndStore = useCallback(async (): Promise<void> => {
    setStatus("loading");
    setError(null);
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted) {
        setStatus(perm.canAskAgain ? "permissionNeeded" : "denied");
        return;
      }
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      const pos =
        last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      const fresh = await service.fetchCurrent(
        pos.coords.latitude,
        pos.coords.longitude,
        unitsRef.current,
      );
      setData(fresh);
      await service.saveCached(db, fresh);
      setStatus("ready");
    } catch (e) {
      setError((e as Error).message ?? String(e));
      setStatus("error");
    }
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await service.loadCached(db);
      if (cancelled) return;
      if (cached) setData(cached);

      const perm = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;

      if (!perm.granted) {
        setStatus(perm.canAskAgain ? "permissionNeeded" : "denied");
        return;
      }

      if (cached && Date.now() - cached.fetchedAt < service.FRESH_MS) {
        setStatus("ready");
        return;
      }
      await fetchAndStore();
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [db, fetchAndStore]);

  useEffect(() => {
    unitsRef.current = units;
    if (data && data.units !== units && status === "ready") {
      fetchAndStore().catch(() => {});
    }
  }, [units, data, status, fetchAndStore]);

  const refresh = useCallback(async () => {
    await fetchAndStore();
  }, [fetchAndStore]);

  const request = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setStatus(perm.canAskAgain ? "permissionNeeded" : "denied");
      return;
    }
    await fetchAndStore();
  }, [fetchAndStore]);

  const isStale = data ? Date.now() - data.fetchedAt >= service.FRESH_MS : false;

  return { status, data, isStale, error, refresh, request };
}
