import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenLayout } from "@/components/templates/ScreenLayout";
import { HeaderBar } from "@/components/templates/HeaderBar";
import { AppText } from "@/components/atoms/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { spacing } from "@/theme/spacing";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScreenLayout edges={["top"]}>
      <HeaderBar title={t("home.title")} />
      <View style={styles.body}>
        <AppText variant="h2">{t("home.welcome")}</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.description}>
          {t("home.description")}
        </AppText>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  description: {
    marginTop: spacing.xs,
  },
});
