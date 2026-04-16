import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { AppInput } from "@/components/atoms/AppInput";
import { AppButton } from "@/components/atoms/AppButton";
import { AppText } from "@/components/atoms/AppText";
import { AppIcon } from "@/components/atoms/AppIcon";
import { SelectInput } from "@/components/molecules/SelectInput";
import { PickerModal } from "@/components/molecules/PickerModal";
import { useTheme } from "@/providers/ThemeProvider";
import { spacing } from "@/theme/spacing";
import { createId } from "@/utils/id";
import type { ButtonSource, GameInput, Team } from "../types";

const TEAM_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

const BUTTON_SOURCES: ButtonSource[] = ["simulated", "switcher"];

function defaultValues(defaultA: string, defaultB: string): GameInput {
  return {
    name: "",
    teams: [
      { id: createId(), name: defaultA, color: TEAM_COLORS[0] },
      { id: createId(), name: defaultB, color: TEAM_COLORS[1] },
    ],
    roundDurationMs: 5 * 60_000,
    roundCount: 3,
    countdownDurationMs: 10_000,
    buttonSource: "simulated",
  };
}

type Props = {
  initialValues?: GameInput;
  submitLabel: string;
  onSubmit: (values: GameInput) => Promise<void> | void;
  onCancel: () => void;
};

export function GameForm({ initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [values, setValues] = useState<GameInput>(() => {
    return (
      initialValues ??
      defaultValues(t("domination.form.defaultTeamA"), t("domination.form.defaultTeamB"))
    );
  });
  const [submitting, setSubmitting] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  const setTeam = (idx: 0 | 1, patch: Partial<Team>) => {
    setValues((prev) => {
      const teams = [...prev.teams] as [Team, Team];
      teams[idx] = { ...teams[idx], ...patch };
      return { ...prev, teams };
    });
  };

  const roundMinutes = String(Math.max(0, Math.round(values.roundDurationMs / 60_000)));
  const countdownSeconds = String(Math.max(0, Math.round(values.countdownDurationMs / 1000)));

  const nameTrimmed = values.name.trim();
  const valid =
    nameTrimmed.length > 0 &&
    values.teams[0].name.trim().length > 0 &&
    values.teams[1].name.trim().length > 0 &&
    values.roundDurationMs > 0 &&
    values.roundCount > 0 &&
    values.countdownDurationMs >= 0;

  const handleSubmit = async () => {
    if (submitting || !valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...values, name: nameTrimmed });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppInput
          label={t("domination.form.name")}
          value={values.name}
          onChangeText={(name) => setValues((v) => ({ ...v, name }))}
          placeholder={t("domination.form.namePlaceholder")}
        />

        {[0, 1].map((i) => {
          const idx = i as 0 | 1;
          return (
            <View key={idx} style={styles.teamGroup}>
              <AppInput
                label={t("domination.form.team", { n: idx + 1 })}
                value={values.teams[idx].name}
                onChangeText={(name) => setTeam(idx, { name })}
              />
              <ColorRow
                selected={values.teams[idx].color}
                onSelect={(color) => setTeam(idx, { color })}
              />
            </View>
          );
        })}

        <AppInput
          label={t("domination.form.roundDurationMinutes")}
          value={roundMinutes}
          onChangeText={(txt) => {
            const n = Math.max(0, parseInt(txt.replace(/\D/g, ""), 10) || 0);
            setValues((v) => ({ ...v, roundDurationMs: n * 60_000 }));
          }}
          keyboardType="number-pad"
        />

        <AppInput
          label={t("domination.form.roundCount")}
          value={String(values.roundCount)}
          onChangeText={(txt) => {
            const n = Math.max(0, parseInt(txt.replace(/\D/g, ""), 10) || 0);
            setValues((v) => ({ ...v, roundCount: n }));
          }}
          keyboardType="number-pad"
        />

        <AppInput
          label={t("domination.form.countdownSeconds")}
          value={countdownSeconds}
          onChangeText={(txt) => {
            const n = Math.max(0, parseInt(txt.replace(/\D/g, ""), 10) || 0);
            setValues((v) => ({ ...v, countdownDurationMs: n * 1000 }));
          }}
          keyboardType="number-pad"
        />

        <SelectInput
          label={t("domination.form.buttonSource")}
          value={t(`domination.buttonSource.${values.buttonSource}`)}
          onPress={() => setSourceModalOpen(true)}
        />

        <View style={styles.actions}>
          <AppButton
            title={t("common.cancel")}
            variant="ghost"
            onPress={onCancel}
            style={styles.cancel}
          />
          <AppButton
            title={submitLabel}
            onPress={handleSubmit}
            disabled={!valid || submitting}
            style={styles.submit}
          />
        </View>
      </ScrollView>

      <PickerModal<ButtonSource>
        visible={sourceModalOpen}
        title={t("domination.form.buttonSource")}
        items={BUTTON_SOURCES}
        keyExtractor={(x) => x}
        selectedKey={values.buttonSource}
        onSelect={(source) => setValues((v) => ({ ...v, buttonSource: source }))}
        onClose={() => setSourceModalOpen(false)}
        renderItem={(item, isSelected) => (
          <>
            <View style={styles.sourceRow}>
              <AppText variant="body">{t(`domination.buttonSource.${item}`)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {t(`domination.buttonSource.${item}Hint`)}
              </AppText>
            </View>
            {isSelected && <AppIcon name="check" color={colors.primary} />}
          </>
        )}
      />
    </>
  );
}

function ColorRow({ selected, onSelect }: { selected: string; onSelect: (color: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.colorRow}>
      {TEAM_COLORS.map((color) => {
        const isSelected = color.toLowerCase() === selected.toLowerCase();
        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.swatch,
              { backgroundColor: color, borderColor: isSelected ? colors.text : "transparent" },
            ]}
            hitSlop={6}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  teamGroup: {
    gap: spacing.sm,
  },
  colorRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancel: {
    flex: 1,
  },
  submit: {
    flex: 2,
  },
  sourceRow: {
    flex: 1,
    gap: 2,
  },
});
