import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { AppText } from "@/components/atoms/AppText";
import { AppButton } from "@/components/atoms/AppButton";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useTheme } from "@/providers/ThemeProvider";
import { useGames } from "@/features/domination/hooks/useGames";
import { spacing } from "@/theme/spacing";

export function QuickStartCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const games = useGames();

  if (games === null) return null;

  if (games.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon name="crosshairs" size={32} color={colors.primary} />
        <AppText variant="h3">{t("home.quickStart.noGamesTitle")}</AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
          {t("home.quickStart.noGamesDescription")}
        </AppText>
        <AppButton
          title={t("home.quickStart.createGame")}
          icon="plus"
          onPress={() => router.push("/domination/new")}
          style={styles.cta}
        />
      </View>
    );
  }

  const mostRecent = games[0];
  const minutes = Math.round(mostRecent.roundDurationMs / 60_000);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("home.quickStart.recentGame")}
      </AppText>
      <View style={styles.gameRow}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: mostRecent.teams[0].color }]} />
          <View style={[styles.dot, { backgroundColor: mostRecent.teams[1].color }]} />
        </View>
        <View style={styles.gameText}>
          <AppText variant="h3" numberOfLines={1}>
            {mostRecent.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t("domination.gameSummary", {
              rounds: mostRecent.roundCount,
              minutes,
            })}
          </AppText>
        </View>
      </View>
      <AppButton
        title={t("home.quickStart.startMatch")}
        icon="play"
        onPress={() => router.push(`/domination/${mostRecent.id}/play`)}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "stretch",
  },
  center: {
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.sm,
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gameText: {
    flex: 1,
    gap: 2,
  },
});
