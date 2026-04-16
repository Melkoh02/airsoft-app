import { createContext, useCallback, useContext, useMemo, useState } from "react";

type DataRefreshContextValue = {
  revisions: Record<string, number>;
  invalidate: (...keys: string[]) => void;
};

const DataRefreshContext = createContext<DataRefreshContextValue | null>(null);

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [revisions, setRevisions] = useState<Record<string, number>>({});

  const invalidate = useCallback((...keys: string[]) => {
    setRevisions((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        next[key] = (prev[key] ?? 0) + 1;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ revisions, invalidate }), [revisions, invalidate]);

  return <DataRefreshContext.Provider value={value}>{children}</DataRefreshContext.Provider>;
}

export function useDataRefresh() {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) throw new Error("useDataRefresh must be used within DataRefreshProvider");
  return ctx;
}
