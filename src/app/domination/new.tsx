import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ModalLayout } from "@/components/templates/ModalLayout";
import { GameForm } from "@/features/domination/components/GameForm";
import { gamesRepository, type GameInput } from "@/features/domination";
import { useDataRefresh } from "@/providers/DataRefreshProvider";

export default function NewGameScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { invalidate } = useDataRefresh();

  const handleSubmit = async (values: GameInput) => {
    await gamesRepository.createGame(db, values);
    invalidate("domination.games");
    router.back();
  };

  return (
    <ModalLayout title={t("domination.form.newTitle")} onClose={() => router.back()}>
      <GameForm
        submitLabel={t("common.create")}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </ModalLayout>
  );
}
