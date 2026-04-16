import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    async (code: string) => {
      await i18n.changeLanguage(code);
    },
    [i18n],
  );

  return { language: i18n.language, changeLanguage };
}
