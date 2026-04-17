import { useState } from "react";
import { View, Pressable, StyleSheet, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { PickerModal } from "@/components/molecules/PickerModal";
import { AppText } from "@/components/atoms/AppText";
import { AppIcon } from "@/components/atoms/AppIcon";
import { Divider } from "@/components/atoms/Divider";
import { useTheme } from "@/providers/ThemeProvider";
import { useSettings, type Units } from "@/providers/SettingsProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { spacing } from "@/theme/spacing";

type ThemeMode = "system" | "light" | "dark";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const { hapticsEnabled, setHapticsEnabled, units, setUnits } = useSettings();
  const { language, changeLanguage } = useLanguage();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUnitsPicker, setShowUnitsPicker] = useState(false);

  const themeOptions: { code: ThemeMode; labelKey: string }[] = [
    { code: "system", labelKey: "settings.themeSystem" },
    { code: "light", labelKey: "settings.themeLight" },
    { code: "dark", labelKey: "settings.themeDark" },
  ];

  const unitsOptions: { code: Units; labelKey: string }[] = [
    { code: "metric", labelKey: "settings.unitsMetric" },
    { code: "imperial", labelKey: "settings.unitsImperial" },
  ];

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? language;
  const currentThemeLabel = t(
    themeOptions.find((o) => o.code === mode)?.labelKey ?? "settings.themeSystem",
  );
  const currentUnitsLabel = t(
    unitsOptions.find((o) => o.code === units)?.labelKey ?? "settings.unitsMetric",
  );

  return (
    <ScreenLayout scrollable edges={["top"]}>
      <HeaderBar title={t("settings.title")} />

      <Pressable
        onPress={() => setShowLanguagePicker(true)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? colors.borderLight : "transparent" },
        ]}
      >
        <AppIcon name="translate" size={22} color={colors.primary} />
        <View style={styles.rowText}>
          <AppText variant="body">{t("settings.language")}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {currentLanguageLabel}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={20} color={colors.iconSecondary} />
      </Pressable>
      <Divider />

      <Pressable
        onPress={() => setShowThemePicker(true)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? colors.borderLight : "transparent" },
        ]}
      >
        <AppIcon name="palette" size={22} color={colors.primary} />
        <View style={styles.rowText}>
          <AppText variant="body">{t("settings.theme")}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {currentThemeLabel}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={20} color={colors.iconSecondary} />
      </Pressable>
      <Divider />

      <Pressable
        onPress={() => setShowUnitsPicker(true)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? colors.borderLight : "transparent" },
        ]}
      >
        <AppIcon name="tape-measure" size={22} color={colors.primary} />
        <View style={styles.rowText}>
          <AppText variant="body">{t("settings.units")}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {currentUnitsLabel}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={20} color={colors.iconSecondary} />
      </Pressable>
      <Divider />

      <View style={styles.row}>
        <AppIcon name="vibrate" size={22} color={colors.primary} />
        <View style={styles.rowText}>
          <AppText variant="body">{t("settings.haptics")}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t("settings.hapticsDescription")}
          </AppText>
        </View>
        <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
      </View>
      <Divider />

      <View style={styles.versionContainer}>
        <AppText variant="caption" color={colors.textTertiary}>
          {t("settings.version", { version: "0.2.0" })}
        </AppText>
      </View>

      <PickerModal
        visible={showLanguagePicker}
        title={t("settings.language")}
        items={SUPPORTED_LANGUAGES.map((l) => ({ code: l.code, label: l.label }))}
        keyExtractor={(item) => item.code}
        selectedKey={language}
        onSelect={(item) => changeLanguage(item.code)}
        onClose={() => setShowLanguagePicker(false)}
        renderItem={(item, isSelected) => (
          <>
            <AppText variant="body" style={styles.pickerLabel}>
              {item.label}
            </AppText>
            {isSelected && <AppIcon name="check" size={20} color={colors.primary} />}
          </>
        )}
      />

      <PickerModal
        visible={showThemePicker}
        title={t("settings.theme")}
        items={themeOptions}
        keyExtractor={(item) => item.code}
        selectedKey={mode}
        onSelect={(item) => setMode(item.code)}
        onClose={() => setShowThemePicker(false)}
        renderItem={(item, isSelected) => (
          <>
            <AppText variant="body" style={styles.pickerLabel}>
              {t(item.labelKey)}
            </AppText>
            {isSelected && <AppIcon name="check" size={20} color={colors.primary} />}
          </>
        )}
      />

      <PickerModal
        visible={showUnitsPicker}
        title={t("settings.units")}
        items={unitsOptions}
        keyExtractor={(item) => item.code}
        selectedKey={units}
        onSelect={(item) => setUnits(item.code)}
        onClose={() => setShowUnitsPicker(false)}
        renderItem={(item, isSelected) => (
          <>
            <AppText variant="body" style={styles.pickerLabel}>
              {t(item.labelKey)}
            </AppText>
            {isSelected && <AppIcon name="check" size={20} color={colors.primary} />}
          </>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  pickerLabel: {
    flex: 1,
  },
});
