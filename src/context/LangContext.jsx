// src/context/LangContext.jsx
// Provides the active UI language to all components.
// Persists choice in localStorage so it survives a page refresh.
import React, { createContext, useContext, useState, useCallback } from "react";
import { t as translate } from "../lib/i18n.js";

const LangContext = createContext();

export const useLang = () => useContext(LangContext);

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(
    () => localStorage.getItem("sona_lang") || "en"
  );

  const changeLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem("sona_lang", code);
    // Update the html[lang] attribute for a11y screen readers
    document.documentElement.lang = code;
  }, []);

  // Convenience: t("key") without passing lang every time
  const t = useCallback((key) => translate(lang, key), [lang]);

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
};
