import { Linking, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/atoms/AppText";
import { AppButton } from "@/components/atoms/AppButton";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useTheme } from "@/providers/ThemeProvider";
import { spacing } from "@/theme/spacing";

const REPO_URL = "https://github.com/Melkoh02/airsoft-app";
const OPEN_METEO_URL = "https://open-meteo.com/";

type Props = {
  visible: boolean;
  version: string;
  onClose: () => void;
};

export function AboutModal({ visible, version, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={["top"]}>
            <View style={styles.header}>
              <AppText variant="h3">{t("settings.about.title")}</AppText>
              <Pressable onPress={onClose} hitSlop={8}>
                <AppIcon name="close" size={22} color={colors.icon} />
              </Pressable>
            </View>
            <View style={styles.body}>
              <AppText variant="h2">{t("home.title")}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {t("settings.version", { version })}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={styles.tagline}>
                {t("settings.about.tagline")}
              </AppText>

              <View style={styles.creditsBlock}>
                <AppText variant="label" color={colors.textSecondary}>
                  {t("settings.about.credits")}
                </AppText>
                <Pressable onPress={() => Linking.openURL(OPEN_METEO_URL)}>
                  <AppText variant="body" color={colors.primary}>
                    {t("settings.about.openMeteo")}
                  </AppText>
                </Pressable>
              </View>

              <AppButton
                title={t("settings.about.viewOnGitHub")}
                icon="github"
                variant="secondary"
                onPress={() => Linking.openURL(REPO_URL)}
                style={styles.cta}
              />
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing["3xl"],
  },
  card: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  tagline: {
    marginTop: spacing.xs,
  },
  creditsBlock: {
    marginTop: spacing.md,
    gap: 2,
  },
  cta: {
    marginTop: spacing.md,
  },
});
