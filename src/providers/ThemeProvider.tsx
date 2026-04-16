import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { lightPalette, darkPalette, applyAccentColor, type ColorPalette } from "@/theme/colors";
import { createThemeTokens, type ThemeTokens } from "@/theme/tokens";

type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = ThemeTokens & {
  mode: ThemeMode;
  accentColor: string | null;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");
  const [accentColor, setAccentColor] = useState<string | null>(null);

  const tokens = useMemo<ThemeTokens>(() => {
    const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
    let palette: ColorPalette = isDark ? { ...darkPalette } : { ...lightPalette };
    if (accentColor) palette = applyAccentColor(palette, accentColor);
    return createThemeTokens(palette, isDark, "auto");
  }, [mode, accentColor, systemScheme]);

  const handleSetMode = useCallback((next: ThemeMode) => setMode(next), []);
  const handleSetAccent = useCallback((color: string | null) => setAccentColor(color), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...tokens,
      mode,
      accentColor,
      setMode: handleSetMode,
      setAccentColor: handleSetAccent,
    }),
    [tokens, mode, accentColor, handleSetMode, handleSetAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
