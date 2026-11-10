/**
 * Small text-direction / translation helper. No dependency.
 *
 *  1. Language: `t("settings.appearance")` picks a string from en.json / ar.json.
 *  2. Direction: Arabic turns the whole interface to RTL (dir attribute on <html>).
 *  3. Digits: optional Arabic-Indic numerals (١٢٣) for displayed dates and numbers.
 *
 * All three settings live in the same saved-prefs store (notecraft:prefs) as the
 * rest of the app, under additive keys `settings:lang` and `settings:digits`.
 */
import { useEffect, useState } from "react";
import { readPref, writePref, subscribePrefs } from "./preferences";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import fr from "./locales/fr.json";
import fa from "./locales/fa.json";
import hi from "./locales/hi.json";
import ur from "./locales/ur.json";
import de from "./locales/de.json";
import es from "./locales/es.json";

const LOCALES = { en, ar, ru, zh, ja, fr, fa, hi, ur, de, es };
export const LANGS = [
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
  { id: "ru", label: "Русский" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
  { id: "fr", label: "Français" },
  { id: "fa", label: "فارسی" },
  { id: "hi", label: "हिन्दी" },
  { id: "ur", label: "اردو" },
  { id: "de", label: "Deutsch" },
  { id: "es", label: "Español" },
];

const LANG_KEY = "settings:lang";
const DIGITS_KEY = "settings:digits";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function getLang() {
  const saved = readPref(LANG_KEY, "en");
  // Validate against supported languages
  const supported = LANGS.map(l => l.id);
  return supported.includes(saved) ? saved : "en";
}

export function isRTL(lang = getLang()) {
  return ["ar", "fa", "ur"].includes(lang);
}

export function getDigits() {
  return readPref(DIGITS_KEY, "latin") === "arabicind" ? "arabicind" : "latin";
}

export function setLang(lang) {
  const supported = LANGS.map(l => l.id);
  writePref(LANG_KEY, supported.includes(lang) ? lang : "en");
  applyI18n();
}

export function setDigits(mode) {
  writePref(DIGITS_KEY, mode === "arabicind" ? "arabicind" : "latin");
}

/** Puts the html lang and dir attributes in sync with the saved language. */
export function applyI18n() {
  if (typeof document === "undefined") return;
  const lang = getLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
}

function lookup(dict, key) {
  const parts = String(key).split(".");
  let value = dict;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) value = value[part];
    else return undefined;
  }
  return value;
}

/** Translate a dot key into the current language, falling back to English, then the key. */
export function t(key) {
  const value = lookup(LOCALES[getLang()], key);
  if (typeof value === "string") return value;
  const fallback = lookup(LOCALES.en, key);
  return typeof fallback === "string" ? fallback : key;
}

/** Replaces 0-9 with Arabic-Indic digits (٠-٩) when the setting is on. */
export function localDigits(text) {
  if (getDigits() !== "arabicind") return text;
  return String(text).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export function formatNumber(n) {
  try {
    return localDigits(Number(n).toLocaleString());
  } catch {
    return localDigits(String(n));
  }
}

export function formatDate(value, options) {
  try {
    return localDigits(new Date(value).toLocaleDateString(undefined, options));
  } catch {
    return "—";
  }
}

export function formatDateTime(value) {
  try {
    return localDigits(new Date(value).toLocaleString());
  } catch {
    return "—";
  }
}

/**
 * Hook for translated components: re-renders them when the language or the
 * digit setting changes, and returns the helpers already bound to them.
 */
export function useI18n() {
  const [, force] = useState(0);
  useEffect(() => subscribePrefs(() => force((n) => n + 1)), []);
  const lang = getLang();
  return {
    lang,
    rtl: isRTL(lang),
    t,
    localDigits,
    formatNumber,
    formatDate,
    formatDateTime,
  };
}
