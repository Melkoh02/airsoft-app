import "@/i18n";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { DataRefreshProvider } from "@/providers/DataRefreshProvider";

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
      <DataRefreshProvider>
        <ThemeProvider>
          <AppStack />
        </ThemeProvider>
      </DataRefreshProvider>
    </SafeAreaProvider>
  );
}
