import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    title: "DeepView",
    subtitle: "Powered by ElsCiber",
    placeholder: "Ask me anything...",
    welcome: "Welcome to DeepView",
  },
  es: {
    title: "DeepView",
    subtitle: "Desarrollado por ElsCiber",
    placeholder: "Pregúntame lo que quieras...",
    welcome: "Bienvenido a DeepView",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("app_language") as Language | null;
    return saved || "en";
  });

  useEffect(() => {
    localStorage.setItem("app_language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
