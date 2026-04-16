import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import * as settingsRepository from "@/data/settingsRepository";

type Settings = {
  hapticsEnabled: boolean;
};

type SettingsContextValue = Settings & {
  setHapticsEnabled: (value: boolean) => void;
  loaded: boolean;
};

const DEFAULTS: Settings = {
  hapticsEnabled: true,
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
        setSettings({
          hapticsEnabled: kv.hapticsEnabled !== "false",
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

  const value = useMemo<SettingsContextValue>(
    () => ({ ...settings, setHapticsEnabled, loaded }),
    [settings, setHapticsEnabled, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

const FALLBACK: SettingsContextValue = {
  ...DEFAULTS,
  setHapticsEnabled: () => {},
  loaded: false,
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  return ctx ?? FALLBACK;
}
