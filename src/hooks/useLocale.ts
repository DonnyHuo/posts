import { useState, useCallback, useEffect } from "react";
import { useLingui } from "@lingui/react";
import { activateLocale, getStoredLocale, locales, type Locale } from "../i18n";

export function useLocale() {
  const { i18n } = useLingui();
  const [locale, setLocale] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    // Sync with i18n on mount
    const storedLocale = getStoredLocale();
    if (i18n.locale !== storedLocale) {
      activateLocale(storedLocale);
      setLocale(storedLocale);
    }
  }, [i18n]);

  const changeLocale = useCallback((newLocale: Locale) => {
    activateLocale(newLocale);
    setLocale(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale = locale === "en" ? "zh" : "en";
    changeLocale(newLocale);
  }, [locale, changeLocale]);

  return {
    locale,
    locales,
    changeLocale,
    toggleLocale,
    isEnglish: locale === "en",
    isChinese: locale === "zh",
  };
}

