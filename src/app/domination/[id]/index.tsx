import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { AppText } from "@/components/atoms/AppText";
import { AppButton } from "@/components/atoms/AppButton";
import { AppIcon } from "@/components/atoms/AppIcon";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ListItem } from "@/components/molecules/ListItem";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { computeMatchStats, gamesRepository } from "@/features/domination";
import type { Game, Match } from "@/features/domination";
import { useGame } from "@/features/domination/hooks/useGame";
import { useMatches } from "@/features/domination/hooks/useMatches";
import { spacing } from "@/theme/spacing";

export default function GameDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { invalidate } = useDataRefresh();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useGame(id);
  const matches = useMatches(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (game === undefined) {
    return (
      <ScreenLayout edges={["top"]}>
        <HeaderBar title="" onBack={() => router.back()} />
      </ScreenLayout>
    );
  }

  if (game === null) {
    return (
      <ScreenLayout edges={["top"]}>
        <HeaderBar title={t("domination.title")} onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title={t("domination.notFound")} />
      </ScreenLayout>
    );
  }

  const roundMinutes = Math.round(game.roundDurationMs / 60_000);
  const countdownSeconds = Math.round(game.countdownDurationMs / 1000);

  const handleDelete = async () => {
    await gamesRepository.deleteGame(db, game.id);
    invalidate("domination.games");
    setConfirmDelete(false);
    router.back();
  };

  return (
    <ScreenLayout edges={["top"]}>
      <HeaderBar
        title={game.name}
        onBack={() => router.back()}
        rightActions={[
          { icon: "pencil", onPress: () => router.push(`/domination/${game.id}/edit`) },
          { icon: "trash-can-outline", onPress: () => setConfirmDelete(true) },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.teamsRow}>
          {game.teams.map((team) => (
            <View
              key={team.id}
              style={[
                styles.teamCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.teamDot, { backgroundColor: team.color }]} />
              <AppText variant="h3">{team.name}</AppText>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Row label={t("domination.detail.rounds")} value={String(game.roundCount)} />
          <Row
            label={t("domination.detail.roundDuration")}
            value={t("domination.detail.minutes", { value: roundMinutes })}
          />
          <Row
            label={t("domination.detail.countdown")}
            value={t("domination.detail.seconds", { value: countdownSeconds })}
          />
          <Row
            label={t("domination.form.buttonSource")}
            value={t(`domination.buttonSource.${game.buttonSource}`)}
          />
        </View>

        <AppButton
          title={t("domination.detail.startMatch")}
          icon="play"
          onPress={() => router.push(`/domination/${game.id}/play`)}
        />

        <MatchHistory game={game} matches={matches} />
      </ScrollView>

      <ConfirmModal
        visible={confirmDelete}
        title={t("domination.detail.deleteTitle")}
        message={t("domination.detail.deleteMessage", { name: game.name })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScreenLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

function MatchHistory({ game, matches }: { game: Game; matches: Match[] | null }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const finished = (matches ?? []).filter((m) => m.status !== "in_progress");

  if (!matches || finished.length === 0) return null;

  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <AppText variant="label" color={colors.textSecondary} style={styles.sectionHeader}>
        {t("domination.detail.recentMatches")}
      </AppText>
      {finished.slice(0, 10).map((match) => {
        const stats = computeMatchStats(match, game);
        const winner = stats.winnerTeamId
          ? (game.teams.find((team) => team.id === stats.winnerTeamId) ?? null)
          : null;
        const title =
          match.status === "aborted"
            ? t("domination.detail.matchAborted")
            : winner
              ? t("domination.detail.matchWinner", { name: winner.name })
              : t("domination.detail.matchTied");
        return (
          <ListItem
            key={match.id}
            onPress={() => router.push(`/domination/${game.id}/summary/${match.id}`)}
            left={
              winner ? (
                <View style={[styles.teamDotSmall, { backgroundColor: winner.color }]} />
              ) : (
                <View style={[styles.teamDotSmall, { backgroundColor: colors.border }]} />
              )
            }
            right={<AppIcon name="chevron-right" color={colors.iconSecondary} />}
          >
            <AppText variant="body">{title}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {new Date(match.startedAt).toLocaleString()}
            </AppText>
          </ListItem>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  teamsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  teamCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  teamDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  section: {
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  teamDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
