import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ListItem } from "@/components/molecules/ListItem";
import { AppText } from "@/components/atoms/AppText";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useDataRefresh } from "@/providers/DataRefreshProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { gamesRepository, type Game } from "@/features/domination";
import { spacing } from "@/theme/spacing";

export default function DominationScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { revisions } = useDataRefresh();
  const [games, setGames] = useState<Game[] | null>(null);
  const rev = revisions["domination.games"] ?? 0;

  useEffect(() => {
    let cancelled = false;
    gamesRepository.listGames(db).then((rows) => {
      if (!cancelled) setGames(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [db, rev]);

  return (
    <ScreenLayout edges={["top"]}>
      <HeaderBar
        title={t("domination.title")}
        rightIcon="plus"
        onRightPress={() => router.push("/domination/new")}
      />
      {games === null ? null : games.length === 0 ? (
        <EmptyState
          icon="crosshairs"
          title={t("domination.empty.title")}
          description={t("domination.empty.description")}
        />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListItem
              left={
                <View style={styles.teamDots}>
                  <View style={[styles.dot, { backgroundColor: item.teams[0].color }]} />
                  <View style={[styles.dot, { backgroundColor: item.teams[1].color }]} />
                </View>
              }
              right={<AppIcon name="chevron-right" color={colors.iconSecondary} />}
            >
              <AppText variant="body">{item.name}</AppText>
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {t("domination.gameSummary", {
                  rounds: item.roundCount,
                  minutes: Math.round(item.roundDurationMs / 60000),
                })}
              </AppText>
            </ListItem>
          )}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
  },
  teamDots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
