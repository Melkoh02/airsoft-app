import { Stack } from "expo-router";
import { useTheme } from "@/providers/ThemeProvider";

export default function DominationLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="new" options={{ presentation: "modal" }} />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="[id]/play" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
