import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ModalLayout } from "@/components/templates/ModalLayout";
import { GameForm } from "@/features/domination/components/GameForm";
import { gamesRepository, type GameInput } from "@/features/domination";
import { useGame } from "@/features/domination/hooks/useGame";
import { useDataRefresh } from "@/providers/DataRefreshProvider";

export default function EditGameScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { invalidate } = useDataRefresh();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useGame(id);

  const handleSubmit = async (values: GameInput) => {
    if (!game) return;
    await gamesRepository.updateGame(db, game.id, values);
    invalidate("domination.games");
    router.back();
  };

  if (!game) {
    return (
      <ModalLayout title={t("domination.form.editTitle")} onClose={() => router.back()}>
        <></>
      </ModalLayout>
    );
  }

  const initialValues: GameInput = {
    name: game.name,
    teams: game.teams,
    roundDurationMs: game.roundDurationMs,
    roundCount: game.roundCount,
    countdownDurationMs: game.countdownDurationMs,
    buttonSource: game.buttonSource,
  };

  return (
    <ModalLayout title={t("domination.form.editTitle")} onClose={() => router.back()}>
      <GameForm
        initialValues={initialValues}
        submitLabel={t("common.save")}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </ModalLayout>
  );
}
