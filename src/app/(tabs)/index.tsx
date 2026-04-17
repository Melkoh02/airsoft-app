import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { WeatherCard } from "@/features/weather/components/WeatherCard";
import { QuickStartCard } from "@/features/home/components/QuickStartCard";
import { RecentMatchesCard } from "@/features/home/components/RecentMatchesCard";
import { LifetimeStatsCard } from "@/features/home/components/LifetimeStatsCard";
import { spacing } from "@/theme/spacing";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScreenLayout scrollable edges={["top"]}>
      <HeaderBar title={t("home.title")} />
      <View style={styles.content}>
        <WeatherCard />
        <QuickStartCard />
        <RecentMatchesCard />
        <LifetimeStatsCard />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
