import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { useSettings } from "@/providers/SettingsProvider";

type HapticKind = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function useHaptic() {
  const { hapticsEnabled } = useSettings();

  return useCallback(
    (kind: HapticKind = "light") => {
      if (!hapticsEnabled) return;
      switch (kind) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return;
        case "heavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          return;
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        case "warning":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return;
        case "error":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
      }
    },
    [hapticsEnabled],
  );
}
