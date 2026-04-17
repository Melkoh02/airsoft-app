import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import * as settingsRepository from "@/data/settingsRepository";

export type Units = "metric" | "imperial";

type Settings = {
  hapticsEnabled: boolean;
  units: Units;
};

type SettingsContextValue = Settings & {
  setHapticsEnabled: (value: boolean) => void;
  setUnits: (value: Units) => void;
  loaded: boolean;
};

const DEFAULTS: Settings = {
  hapticsEnabled: true,
  units: "metric",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingsRepository
      .getAll(db)
      .then((kv) => {
        if (cancelled) return;
        const units: Units = kv.units === "imperial" ? "imperial" : "metric";
        setSettings({
          hapticsEnabled: kv.hapticsEnabled !== "false",
          units,
        });
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setHapticsEnabled = useCallback(
    (value: boolean) => {
      setSettings((s) => ({ ...s, hapticsEnabled: value }));
      settingsRepository.set(db, "hapticsEnabled", value ? "true" : "false").catch(() => {});
    },
    [db],
  );

  const setUnits = useCallback(
    (value: Units) => {
      setSettings((s) => ({ ...s, units: value }));
      settingsRepository.set(db, "units", value).catch(() => {});
    },
    [db],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ ...settings, setHapticsEnabled, setUnits, loaded }),
    [settings, setHapticsEnabled, setUnits, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

const FALLBACK: SettingsContextValue = {
  ...DEFAULTS,
  setHapticsEnabled: () => {},
  setUnits: () => {},
  loaded: false,
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  return ctx ?? FALLBACK;
}
