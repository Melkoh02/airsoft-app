import "@/i18n";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteProvider } from "expo-sqlite";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { DataRefreshProvider } from "@/providers/DataRefreshProvider";
import { DATABASE_NAME, initDatabase } from "@/db";

function AppStatusBar() {
  const { statusBarStyle, isDark } = useTheme();
  const resolvedStyle = statusBarStyle === "auto" ? (isDark ? "light" : "dark") : statusBarStyle;

  return <StatusBar style={resolvedStyle} />;
}

function AppStack() {
  const { colors } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AppStatusBar />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <DataRefreshProvider>
          <ThemeProvider>
            <AppStack />
          </ThemeProvider>
        </DataRefreshProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
