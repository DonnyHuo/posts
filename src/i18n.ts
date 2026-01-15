import { i18n } from "@lingui/core";
import { messages as enMessages } from "./locales/en";
import { messages as zhMessages } from "./locales/zh";

export type Locale = "en" | "zh";

export const locales: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export const defaultLocale: Locale = "en";

// Load all locales
i18n.load({
  en: enMessages,
  zh: zhMessages,
});

// Get saved locale from localStorage or use default
export function getStoredLocale(): Locale {
  const stored = localStorage.getItem("locale") as Locale | null;
  if (stored && stored in locales) {
    return stored;
  }
  // Try to detect browser language
  const browserLang = navigator.language.split("-")[0];
  if (browserLang in locales) {
    return browserLang as Locale;
  }
  return defaultLocale;
}

// Save locale to localStorage
export function setStoredLocale(locale: Locale): void {
  localStorage.setItem("locale", locale);
}

// Activate a locale
export function activateLocale(locale: Locale): void {
  i18n.activate(locale);
  setStoredLocale(locale);
  document.documentElement.lang = locale;
}

// Initialize i18n with stored locale
export function initI18n(): void {
  const locale = getStoredLocale();
  activateLocale(locale);
}

export { i18n };
