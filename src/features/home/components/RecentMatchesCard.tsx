import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { AppText } from "@/components/atoms/AppText";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useTheme } from "@/providers/ThemeProvider";
import { computeMatchStats } from "@/features/domination";
import { useGames } from "@/features/domination/hooks/useGames";
import { useGlobalMatches } from "@/features/domination/hooks/useGlobalMatches";
import type { Game, Match } from "@/features/domination";
import { spacing } from "@/theme/spacing";

export function RecentMatchesCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const matches = useGlobalMatches(3);
  const games = useGames();

  if (!matches || !games || matches.length === 0) return null;

  const gameById = new Map<string, Game>(games.map((g) => [g.id, g]));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("home.recent.title")}
      </AppText>
      {matches.map((match) => {
        const game = gameById.get(match.gameId);
        if (!game) return null;
        return <RecentRow key={match.id} match={match} game={game} />;
      })}
    </View>
  );
}

function RecentRow({ match, game }: { match: Match; game: Game }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stats = computeMatchStats(match, game);
  const winner = stats.winnerTeamId ? game.teams.find((tt) => tt.id === stats.winnerTeamId) : null;

  const outcome =
    match.status === "aborted"
      ? t("domination.detail.matchAborted")
      : winner
        ? winner.name
        : t("domination.detail.matchTied");

  return (
    <Pressable
      onPress={() => router.push(`/domination/${match.gameId}/summary/${match.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.borderLight : "transparent" },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: winner?.color ?? colors.border }]} />
      <View style={styles.text}>
        <AppText variant="body" numberOfLines={1}>
          {game.name}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {outcome} · {new Date(match.startedAt).toLocaleDateString()}
        </AppText>
      </View>
      <AppIcon name="chevron-right" size={20} color={colors.iconSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.sm,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
