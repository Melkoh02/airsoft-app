import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import * as settingsRepository from "@/data/settingsRepository";

export type Units = "metric" | "imperial";

type Settings = {
  hapticsEnabled: boolean;
  units: Units;
  switcherHost: string;
};

type SettingsContextValue = Settings & {
  setHapticsEnabled: (value: boolean) => void;
  setUnits: (value: Units) => void;
  setSwitcherHost: (value: string) => void;
  loaded: boolean;
};

const DEFAULT_SWITCHER_HOST = "rasp314.local:8765";

const DEFAULTS: Settings = {
  hapticsEnabled: true,
  units: "metric",
  switcherHost: DEFAULT_SWITCHER_HOST,
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
          switcherHost: kv.switcherHost ?? DEFAULT_SWITCHER_HOST,
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

  const setSwitcherHost = useCallback(
    (value: string) => {
      const next = value.trim() || DEFAULT_SWITCHER_HOST;
      setSettings((s) => ({ ...s, switcherHost: next }));
      settingsRepository.set(db, "switcherHost", next).catch(() => {});
    },
    [db],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ ...settings, setHapticsEnabled, setUnits, setSwitcherHost, loaded }),
    [settings, setHapticsEnabled, setUnits, setSwitcherHost, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

const FALLBACK: SettingsContextValue = {
  ...DEFAULTS,
  setHapticsEnabled: () => {},
  setUnits: () => {},
  setSwitcherHost: () => {},
  loaded: false,
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  return ctx ?? FALLBACK;
}
