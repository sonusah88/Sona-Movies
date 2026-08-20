// src/lib/i18n.js
// Lightweight translation dictionary — no npm dependency needed.
// Add new languages by adding a new key matching an IETF language tag.

export const LANGUAGES = [
  { code: "en", label: "EN", native: "English", flag: "🇬🇧" },
  { code: "hi", label: "HI", native: "हिन्दी", flag: "🇮🇳" },
  { code: "ne", label: "NE", native: "नेपाली", flag: "🇳🇵" },
];

export const translations = {
  en: {
    discover:    "Discover",
    tvShows:     "TV Shows",
    newReleases: "New",
    shorts:      "Shorts",
    library:     "Library",
    liveTV:      "Live TV",
    bestForYou:  "Best For You",
    search:      "Search movies, shows...",
    switchServer:"Switch server if not playing:",
    help:        "Help",
    rotate:      "Rotate",
    volumeBoost: "Volume Booster",
    reportIssue: "Report Issue",
    reported:    "Reported!",
  },
  hi: {
    discover:    "खोजें",
    tvShows:     "टीवी शो",
    newReleases: "नया",
    shorts:      "शॉर्ट्स",
    library:     "पुस्तकालय",
    liveTV:      "लाइव टीवी",
    bestForYou:  "आपके लिए",
    search:      "फिल्म, शो खोजें...",
    switchServer:"सर्वर बदलें:",
    help:        "मदद",
    rotate:      "घुमाएं",
    volumeBoost: "आवाज़ बढ़ाएं",
    reportIssue: "समस्या रिपोर्ट करें",
    reported:    "रिपोर्ट हो गया!",
  },
  ne: {
    discover:    "खोज्नुहोस्",
    tvShows:     "टिभी शो",
    newReleases: "नयाँ",
    shorts:      "छोटो भिडियो",
    library:     "पुस्तकालय",
    liveTV:      "लाइभ टिभी",
    bestForYou:  "तपाईंका लागि",
    search:      "चलचित्र, शो खोज्नुहोस्...",
    switchServer:"सर्भर परिवर्तन गर्नुहोस्:",
    help:        "सहायता",
    rotate:      "घुमाउनुहोस्",
    volumeBoost: "आवाज बढाउनुहोस्",
    reportIssue: "समस्या रिपोर्ट गर्नुहोस्",
    reported:    "रिपोर्ट भयो!",
  },
};

/** Safely look up a translation key, falling back to English. */
export function t(lang, key) {
  return translations[lang]?.[key] ?? translations["en"][key] ?? key;
}
