import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/atoms/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { computeGlobalStats } from "@/features/domination";
import { useGlobalMatches } from "@/features/domination/hooks/useGlobalMatches";
import { spacing } from "@/theme/spacing";

export function LifetimeStatsCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const matches = useGlobalMatches();

  if (!matches || matches.length === 0) return null;

  const stats = computeGlobalStats(matches);
  const totalMinutes = Math.round(stats.totalActiveMs / 60_000);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("home.lifetime.title")}
      </AppText>
      <View style={styles.metricsRow}>
        <Metric value={String(stats.matchesPlayed)} label={t("home.lifetime.matches")} />
        <Metric value={String(stats.roundsPlayed)} label={t("home.lifetime.rounds")} />
        <Metric value={String(totalMinutes)} label={t("home.lifetime.minutes")} />
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metric}>
      <AppText variant="amount" color={colors.text}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
});
