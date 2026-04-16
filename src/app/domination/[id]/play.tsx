import { useEffect, useState } from "react";
import { BackHandler, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { AppText } from "@/components/atoms/AppText";
import { AppButton } from "@/components/atoms/AppButton";
import { AppIcon } from "@/components/atoms/AppIcon";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useTheme } from "@/providers/ThemeProvider";
import { useGame } from "@/features/domination/hooks/useGame";
import { useMatchEngine } from "@/features/domination/hooks/useMatchEngine";
import { SimulatedButtonSource } from "@/features/domination";
import { useHaptic } from "@/hooks/useHaptic";
import { useNow } from "@/hooks/useNow";
import {
  roundElapsedMs,
  teamAccumulatedMs,
  type MatchEngineState,
} from "@/features/domination/matchEngine";
import type { Game, Team } from "@/features/domination";
import { spacing } from "@/theme/spacing";
import { formatDuration } from "@/utils/format";

export default function PlayScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useGame(id);

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

  return <PlayContent game={game} />;
}

function PlayContent({ game }: { game: Game }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [source] = useState(() => new SimulatedButtonSource());
  const [confirmAbort, setConfirmAbort] = useState(false);
  const haptic = useHaptic();
  useKeepAwake("domination-match");

  const { state, dispatch, match } = useMatchEngine({
    game,
    onAborted: () => router.back(),
  });

  useEffect(() => {
    source.start();
    const unsub = source.onPress((ev) => {
      haptic("medium");
      dispatch({ type: "press", teamId: ev.teamId, at: ev.at });
    });
    return () => {
      unsub();
      source.stop();
    };
  }, [source, dispatch, haptic]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (state.status === "idle" || state.status === "completed" || state.status === "aborted") {
        return false;
      }
      setConfirmAbort(true);
      return true;
    });
    return () => sub.remove();
  }, [state.status]);

  const onBack = () => {
    if (state.status === "idle" || state.status === "completed" || state.status === "aborted") {
      router.back();
    } else {
      setConfirmAbort(true);
    }
  };

  const now = useNow(200);
  const [teamA, teamB] = game.teams;
  const showSwitcherBanner = game.buttonSource === "switcher";

  return (
    <ScreenLayout edges={["top"]}>
      <HeaderBar
        title={t("domination.play.roundLabel", {
          current: state.currentRound + 1,
          total: game.roundCount,
        })}
        onBack={onBack}
      />

      {showSwitcherBanner && (
        <View style={[styles.banner, { backgroundColor: colors.warning + "22" }]}>
          <AppIcon name="information-outline" size={18} color={colors.warning} />
          <AppText variant="caption" color={colors.text}>
            {t("domination.play.switcherFallback")}
          </AppText>
        </View>
      )}

      <View style={styles.body}>
        <RoundClock state={state} game={game} now={now} />

        <View style={styles.teamsRow}>
          <TeamTile
            team={teamA}
            accumulatedMs={teamAccumulatedMs(state, teamA.id, now)}
            dominating={state.currentOwner === teamA.id && state.status === "active"}
          />
          <TeamTile
            team={teamB}
            accumulatedMs={teamAccumulatedMs(state, teamB.id, now)}
            dominating={state.currentOwner === teamB.id && state.status === "active"}
          />
        </View>

        <Controls state={state} dispatch={dispatch} onAbort={() => setConfirmAbort(true)} />

        <SimulatedButtons
          game={game}
          enabled={state.status === "active"}
          onPress={(teamId) => source.trigger(teamId)}
        />
      </View>

      {state.status === "countdown" && state.countdownStartedAt !== null && (
        <CountdownOverlay
          startedAt={state.countdownStartedAt}
          durationMs={game.countdownDurationMs}
          now={now}
        />
      )}

      {state.status === "roundEnded" && (
        <RoundEndedOverlay state={state} game={game} dispatch={dispatch} />
      )}

      {state.status === "completed" && (
        <CompletedOverlay state={state} game={game} matchId={match?.id} />
      )}

      <ConfirmModal
        visible={confirmAbort}
        title={t("domination.play.abort.title")}
        message={t("domination.play.abort.message")}
        confirmLabel={t("domination.play.abort.confirm")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={() => {
          setConfirmAbort(false);
          dispatch({ type: "abort" });
        }}
        onCancel={() => setConfirmAbort(false)}
      />
    </ScreenLayout>
  );
}

function RoundClock({ state, game, now }: { state: MatchEngineState; game: Game; now: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const remaining = Math.max(0, game.roundDurationMs - roundElapsedMs(state, now));
  const label =
    state.status === "paused"
      ? t("domination.play.paused")
      : state.status === "idle"
        ? t("domination.play.ready")
        : null;

  return (
    <View style={styles.clock}>
      <AppText style={[styles.clockValue, { color: colors.text }]}>
        {formatDuration(remaining)}
      </AppText>
      {label && (
        <AppText variant="label" color={colors.textSecondary}>
          {label}
        </AppText>
      )}
    </View>
  );
}

function TeamTile({
  team,
  accumulatedMs,
  dominating,
}: {
  team: Team;
  accumulatedMs: number;
  dominating: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.teamTile,
        {
          backgroundColor: dominating ? team.color : colors.surface,
          borderColor: team.color,
        },
      ]}
    >
      <View style={[styles.teamDot, { backgroundColor: dominating ? "#FFFFFF" : team.color }]} />
      <AppText variant="h3" color={dominating ? "#FFFFFF" : colors.text}>
        {team.name}
      </AppText>
      <AppText
        variant="amount"
        color={dominating ? "#FFFFFF" : colors.text}
        style={styles.teamTime}
      >
        {formatDuration(accumulatedMs)}
      </AppText>
      {dominating && (
        <AppText variant="caption" color="#FFFFFF">
          {t("domination.play.dominating")}
        </AppText>
      )}
    </View>
  );
}

function Controls({
  state,
  dispatch,
  onAbort,
}: {
  state: MatchEngineState;
  dispatch: ReturnType<typeof useMatchEngine>["dispatch"];
  onAbort: () => void;
}) {
  const { t } = useTranslation();

  if (state.status === "idle") {
    return (
      <AppButton
        title={t("domination.play.startRound")}
        icon="play"
        onPress={() => dispatch({ type: "startRound" })}
      />
    );
  }

  if (state.status === "active" || state.status === "paused") {
    return (
      <View style={styles.controls}>
        {state.status === "active" ? (
          <AppButton
            title={t("domination.play.pause")}
            icon="pause"
            variant="secondary"
            onPress={() => dispatch({ type: "pause" })}
            style={styles.controlBtn}
          />
        ) : (
          <AppButton
            title={t("domination.play.resume")}
            icon="play"
            onPress={() => dispatch({ type: "resume" })}
            style={styles.controlBtn}
          />
        )}
        <AppButton
          title={t("domination.play.endRound")}
          variant="ghost"
          onPress={() => dispatch({ type: "endRound" })}
          style={styles.controlBtn}
        />
        <AppButton
          title={t("common.cancel")}
          variant="danger"
          icon="stop"
          onPress={onAbort}
          style={styles.controlBtn}
        />
      </View>
    );
  }

  return null;
}

function SimulatedButtons({
  game,
  enabled,
  onPress,
}: {
  game: Game;
  enabled: boolean;
  onPress: (teamId: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [teamA, teamB] = game.teams;
  return (
    <View style={styles.simRow}>
      {[teamA, teamB].map((team) => (
        <Pressable
          key={team.id}
          onPress={() => enabled && onPress(team.id)}
          disabled={!enabled}
          style={({ pressed }) => [
            styles.simBtn,
            {
              backgroundColor: team.color,
              opacity: !enabled ? 0.4 : pressed ? 0.75 : 1,
            },
          ]}
        >
          <AppText variant="button" color="#FFFFFF">
            {t("domination.play.press", { team: team.name })}
          </AppText>
        </Pressable>
      ))}
      {!enabled && (
        <AppText variant="caption" color={colors.textTertiary} style={styles.simHint}>
          {t("domination.play.pressDisabled")}
        </AppText>
      )}
    </View>
  );
}

function CountdownOverlay({
  startedAt,
  durationMs,
  now,
}: {
  startedAt: number;
  durationMs: number;
  now: number;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const remainingMs = Math.max(0, durationMs - (now - startedAt));
  const seconds = Math.ceil(remainingMs / 1000);
  const display = seconds > 0 ? String(seconds) : t("domination.play.go");
  return (
    <View style={[styles.overlay, { backgroundColor: colors.background + "EE" }]}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("domination.play.getReady")}
      </AppText>
      <AppText style={[styles.countdownValue, { color: colors.text }]}>{display}</AppText>
    </View>
  );
}

function RoundEndedOverlay({
  state,
  game,
  dispatch,
}: {
  state: MatchEngineState;
  game: Game;
  dispatch: ReturnType<typeof useMatchEngine>["dispatch"];
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const lastRound = state.completedRounds[state.completedRounds.length - 1];
  const isLast = state.currentRound + 1 >= game.roundCount;
  const winnerTeam = lastRound?.winnerTeamId
    ? game.teams.find((tm) => tm.id === lastRound.winnerTeamId)
    : null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background + "EE" }]}>
      <AppText variant="h2">
        {t("domination.play.roundOver", { n: state.currentRound + 1 })}
      </AppText>
      {winnerTeam ? (
        <View style={styles.winnerRow}>
          <View style={[styles.teamDot, { backgroundColor: winnerTeam.color }]} />
          <AppText variant="h3">
            {t("domination.play.roundWinner", { name: winnerTeam.name })}
          </AppText>
        </View>
      ) : (
        <AppText variant="h3" color={colors.textSecondary}>
          {t("domination.play.roundTied")}
        </AppText>
      )}
      <AppButton
        title={isLast ? t("domination.play.finish") : t("domination.play.nextRound")}
        icon={isLast ? "flag-checkered" : "skip-next"}
        onPress={() => dispatch({ type: "nextRound" })}
      />
    </View>
  );
}

function CompletedOverlay({
  state,
  game,
  matchId,
}: {
  state: MatchEngineState;
  game: Game;
  matchId: string | undefined;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [teamA, teamB] = game.teams;
  const aWins = state.completedRounds.filter((r) => r.winnerTeamId === teamA.id).length;
  const bWins = state.completedRounds.filter((r) => r.winnerTeamId === teamB.id).length;
  const winner = aWins > bWins ? teamA : bWins > aWins ? teamB : null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background + "EE" }]}>
      <AppText variant="h2">{t("domination.play.matchComplete")}</AppText>
      {winner ? (
        <View style={styles.winnerRow}>
          <View style={[styles.teamDot, { backgroundColor: winner.color }]} />
          <AppText variant="h3">{t("domination.play.matchWinner", { name: winner.name })}</AppText>
        </View>
      ) : (
        <AppText variant="h3" color={colors.textSecondary}>
          {t("domination.play.matchTied")}
        </AppText>
      )}
      <AppText variant="body" color={colors.textSecondary}>
        {t("domination.play.roundsWon", {
          a: aWins,
          b: bWins,
          nameA: teamA.name,
          nameB: teamB.name,
        })}
      </AppText>
      <AppButton
        title={t("domination.play.viewSummary")}
        icon="chart-bar"
        disabled={!matchId}
        onPress={() =>
          matchId && router.replace(`/domination/${game.id}/summary/${matchId}` as never)
        }
      />
      <AppButton title={t("common.done")} variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    borderRadius: 8,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  clock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  clockValue: {
    fontSize: 72,
    lineHeight: 88,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  teamsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  teamTile: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 140,
  },
  teamDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  teamTime: {
    fontVariant: ["tabular-nums"],
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  controlBtn: {
    flex: 1,
    minWidth: 100,
  },
  simRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: "auto",
  },
  simBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  simHint: {
    position: "absolute",
    bottom: -spacing.lg,
    left: 0,
    right: 0,
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["3xl"],
    gap: spacing.lg,
  },
  countdownValue: {
    fontSize: 128,
    lineHeight: 156,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
