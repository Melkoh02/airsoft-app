import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { AppText } from "@/components/atoms/AppText";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useTheme } from "@/providers/ThemeProvider";
import { useGame } from "@/features/domination/hooks/useGame";
import { useMatch } from "@/features/domination/hooks/useMatches";
import { computeMatchStats } from "@/features/domination/stats";
import type { Team } from "@/features/domination";
import { spacing } from "@/theme/spacing";
import { formatDuration } from "@/utils/format";

export default function SummaryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
  const game = useGame(id);
  const match = useMatch(matchId);

  if (game === undefined || match === undefined) {
    return (
      <ScreenLayout edges={["top"]}>
        <HeaderBar title="" onBack={() => router.back()} />
      </ScreenLayout>
    );
  }

  if (!game || !match) {
    return (
      <ScreenLayout edges={["top"]}>
        <HeaderBar title={t("domination.summary.title")} onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title={t("domination.summary.notFound")} />
      </ScreenLayout>
    );
  }

  const stats = computeMatchStats(match, game);
  const [teamA, teamB] = game.teams;
  const winner = stats.winnerTeamId
    ? (game.teams.find((tm) => tm.id === stats.winnerTeamId) ?? null)
    : null;

  const headerText =
    match.status === "aborted"
      ? t("domination.summary.aborted")
      : winner
        ? t("domination.summary.winner", { name: winner.name })
        : t("domination.summary.tied");

  return (
    <ScreenLayout edges={["top"]} scrollable>
      <HeaderBar title={t("domination.summary.title")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.banner,
            { backgroundColor: winner?.color ?? colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="h2" color={winner ? "#FFFFFF" : colors.text}>
            {headerText}
          </AppText>
          <AppText variant="caption" color={winner ? "#FFFFFFCC" : colors.textSecondary}>
            {new Date(match.startedAt).toLocaleString()}
          </AppText>
        </View>

        <View style={styles.totalsRow}>
          <TeamTotal
            team={teamA}
            roundsWon={stats.roundsWonByTeam[teamA.id] ?? 0}
            totalMs={stats.totalDominationMsByTeam[teamA.id] ?? 0}
          />
          <TeamTotal
            team={teamB}
            roundsWon={stats.roundsWonByTeam[teamB.id] ?? 0}
            totalMs={stats.totalDominationMsByTeam[teamB.id] ?? 0}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            {t("domination.summary.roundBreakdown")}
          </AppText>
          {match.rounds.map((round) => {
            const roundWinner = round.winnerTeamId
              ? (game.teams.find((tm) => tm.id === round.winnerTeamId) ?? null)
              : null;
            return (
              <View
                key={round.index}
                style={[styles.roundRow, { borderTopColor: colors.borderLight }]}
              >
                <View style={styles.roundHeader}>
                  <AppText variant="body">
                    {t("domination.summary.round", { n: round.index + 1 })}
                  </AppText>
                  {roundWinner ? (
                    <View style={styles.winnerChip}>
                      <View style={[styles.dotSmall, { backgroundColor: roundWinner.color }]} />
                      <AppText variant="caption" color={colors.textSecondary}>
                        {roundWinner.name}
                      </AppText>
                    </View>
                  ) : (
                    <AppText variant="caption" color={colors.textSecondary}>
                      {t("domination.summary.roundTied")}
                    </AppText>
                  )}
                </View>
                <View style={styles.roundTimes}>
                  <RoundTimeCell team={teamA} ms={round.dominationMsByTeam[teamA.id] ?? 0} />
                  <RoundTimeCell team={teamB} ms={round.dominationMsByTeam[teamB.id] ?? 0} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

function TeamTotal({
  team,
  roundsWon,
  totalMs,
}: {
  team: Team;
  roundsWon: number;
  totalMs: number;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: team.color }]}>
      <View style={[styles.dot, { backgroundColor: team.color }]} />
      <AppText variant="h3">{team.name}</AppText>
      <AppText variant="bodySmall" color={colors.textSecondary}>
        {t("domination.summary.roundsWonCount", { n: roundsWon })}
      </AppText>
      <AppText variant="amount" color={team.color}>
        {formatDuration(totalMs)}
      </AppText>
    </View>
  );
}

function RoundTimeCell({ team, ms }: { team: Team; ms: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.roundTime}>
      <AppText variant="caption" color={team.color}>
        {team.name}
      </AppText>
      <AppText variant="body" color={colors.text} style={styles.timeValue}>
        {formatDuration(ms)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  banner: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
  },
  totalsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  teamCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  section: {
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  roundRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  roundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  winnerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  roundTimes: {
    flexDirection: "row",
    gap: spacing.md,
  },
  roundTime: {
    flex: 1,
    gap: 2,
  },
  timeValue: {
    fontVariant: ["tabular-nums"],
  },
});
