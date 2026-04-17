import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/atoms/AppText";
import { AppIcon } from "@/components/atoms/AppIcon";
import { AppButton } from "@/components/atoms/AppButton";
import { useTheme } from "@/providers/ThemeProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useWeather } from "../hooks/useWeather";
import { i18nKeyForCode, iconForCode } from "../codes";
import { spacing } from "@/theme/spacing";

export function WeatherCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { units, loaded } = useSettings();
  const weather = useWeather(units);

  if (!loaded) return null;

  if (!weather.data) {
    if (weather.status === "permissionNeeded" || weather.status === "denied") {
      const denied = weather.status === "denied";
      return (
        <Card>
          <AppIcon name="weather-partly-cloudy" size={32} color={colors.iconSecondary} />
          <AppText variant="body">{t("home.weather.enableTitle")}</AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
            {t("home.weather.enableDescription")}
          </AppText>
          <AppButton
            title={denied ? t("home.weather.openSettings") : t("home.weather.enable")}
            variant="secondary"
            onPress={() => (denied ? Linking.openSettings() : weather.request())}
            style={styles.cta}
          />
        </Card>
      );
    }
    if (weather.status === "loading") {
      return (
        <Card>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" color={colors.textSecondary}>
            {t("home.weather.loading")}
          </AppText>
        </Card>
      );
    }
    if (weather.status === "error") {
      return (
        <Card>
          <AppIcon name="alert-circle-outline" color={colors.danger} />
          <AppText variant="caption" color={colors.textSecondary}>
            {t("home.weather.error")}
          </AppText>
          <AppButton title={t("home.weather.retry")} variant="ghost" onPress={weather.refresh} />
        </Card>
      );
    }
    return null;
  }

  const d = weather.data;
  const tempUnit = d.units === "imperial" ? "°F" : "°C";
  const windUnit = d.units === "imperial" ? "mph" : "km/h";
  const sunrise = formatHourMinute(d.daily.sunrise);
  const sunset = formatHourMinute(d.daily.sunset);

  return (
    <Pressable
      onPress={() => weather.refresh()}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.weatherRow}>
        <AppIcon name={iconForCode(d.current.weatherCode)} size={48} color={colors.primary} />
        <View style={styles.weatherText}>
          <AppText variant="amountLarge">
            {Math.round(d.current.temperature)}
            {tempUnit}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t(i18nKeyForCode(d.current.weatherCode))}
          </AppText>
        </View>
      </View>
      <View style={styles.subRow}>
        <View style={styles.subItem}>
          <AppIcon name="weather-windy" size={14} color={colors.iconSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            {Math.round(d.current.windSpeed)} {windUnit}
          </AppText>
        </View>
        <View style={styles.subItem}>
          <AppIcon name="weather-sunset-up" size={14} color={colors.iconSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            {sunrise}
          </AppText>
        </View>
        <View style={styles.subItem}>
          <AppIcon name="weather-sunset-down" size={14} color={colors.iconSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            {sunset}
          </AppText>
        </View>
      </View>
      {weather.isStale && (
        <AppText variant="caption" color={colors.textTertiary} style={styles.stale}>
          {t("home.weather.stale")}
        </AppText>
      )}
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

function formatHourMinute(iso: string): string {
  if (!iso) return "--";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  center: {
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.sm,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    alignSelf: "stretch",
  },
  weatherText: {
    flex: 1,
  },
  subRow: {
    flexDirection: "row",
    gap: spacing.lg,
    alignSelf: "stretch",
    marginTop: spacing.xs,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stale: {
    textAlign: "right",
    alignSelf: "stretch",
  },
});
