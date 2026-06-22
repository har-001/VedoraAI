"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type LanguageType = "en" | "hi" | "es" | "de";

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const TRANSLATIONS: Record<LanguageType, Record<string, string>> = {
  en: {
    // Navigation
    nav_overview: "Overview",
    nav_markets: "Markets",
    nav_watchlist: "Watchlist",
    nav_portfolio: "Portfolio",
    nav_backtest: "Strategy Lab",
    nav_community: "Community",
    nav_predictions: "AI Predictions",
    nav_news: "News",
    nav_coach: "AI Coach",
    nav_learn: "Learn",
    nav_settings: "Settings",
    
    // Overview Dashboard
    ov_welcome: "Welcome back",
    ov_sub: "Real-time AI-powered financial intelligence dashboard at your fingertips.",
    ov_scanner: "Technical Patterns Scanner",
    ov_indices: "Indian Market Indices",
    ov_gainers: "Top Gainers",
    ov_losers: "Top Losers",
    
    // Strategy Lab
    sl_title: "Strategy Lab",
    sl_sub: "Backtest customized quantitative trading strategies on historical asset data",
    sl_config: "Configuration",
    sl_run: "Run Simulation",
    sl_simulating: "Simulating...",
    sl_net_return: "Net Strategy Return",
    sl_benchmark_return: "Benchmark Return",
    sl_max_drawdown: "Max Drawdown",
    sl_win_rate: "Win Rate",
    sl_transactions: "Transactions History",
    
    // Community Feed
    cf_title: "Community Sentiment Feed",
    cf_sub: "Share quantitative backtest results, trade ideas, and discuss market views",
    cf_share: "Share a Market View",
    cf_post_title: "Title / Main Idea",
    cf_post_desc: "Describe your thesis, findings, or analysis...",
    cf_post_symbol: "Asset Symbol (e.g. TCS) - Optional",
    cf_attach_bt: "Attach Last Backtest",
    cf_btn_share: "Share Post",
    cf_discussions: "Latest Discussions",
    
    // Alerts
    al_dropdown_title: "Price & Pattern Alerts",
    al_btn_create: "Create Alert",
    al_btn_check: "Check",
    al_status_active: "Active",
    al_status_triggered: "Triggered",
    al_empty: "No alerts configured.",
    al_modal_title: "Create Alert",
    al_symbol: "Symbol",
    al_type: "Alert Type",
    al_price_above: "Price Crosses Above (>=)",
    al_price_below: "Price Crosses Below (<=)",
    al_pattern: "Technical Scanner Pattern",
    al_target_price: "Target Price",
    al_pattern_name: "Pattern Name",
    al_btn_cancel: "Cancel",
    al_btn_confirm: "Create",
  },
  hi: {
    // Navigation
    nav_overview: "अवलोकन",
    nav_markets: "बाज़ार",
    nav_watchlist: "वॉचलिस्ट",
    nav_portfolio: "पोर्टफोलियो",
    nav_backtest: "रणनीति लैब",
    nav_community: "समुदाय",
    nav_predictions: "एआई भविष्यवाणियां",
    nav_news: "समाचार",
    nav_coach: "एआई कोच",
    nav_learn: "सीखें",
    nav_settings: "सेटिंग्स",
    
    // Overview Dashboard
    ov_welcome: "आपका स्वागत है",
    ov_sub: "वास्तविक समय में एआई-संचालित वित्तीय खुफिया डैशबोर्ड आपकी उंगलियों पर।",
    ov_scanner: "तकनीकी पैटर्न स्कैनर",
    ov_indices: "भारतीय बाजार सूचकांक",
    ov_gainers: "शीर्ष लाभार्थी",
    ov_losers: "शीर्ष घाटे में",
    
    // Strategy Lab
    sl_title: "रणनीति लैब",
    sl_sub: "ऐतिहासिक संपत्ति डेटा पर अनुकूलित मात्रात्मक व्यापार रणनीतियों का बैकटेस्ट करें",
    sl_config: "विन्यास",
    sl_run: "सिमुलेशन चलाएं",
    sl_simulating: "सिमुलेशन जारी है...",
    sl_net_return: "शुद्ध रणनीति वापसी",
    sl_benchmark_return: "बेंचमार्क वापसी",
    sl_max_drawdown: "अधिकतम गिरावट",
    sl_win_rate: "जीत की दर",
    sl_transactions: "लेन-देन इतिहास",
    
    // Community Feed
    cf_title: "सामुदायिक भावना फ़ीड",
    cf_sub: "मात्रात्मक बैकटेस्ट परिणाम, व्यापारिक विचार साझा करें और बाजार के विचारों पर चर्चा करें",
    cf_share: "बाजार दृष्टिकोण साझा करें",
    cf_post_title: "शीर्षक / मुख्य विचार",
    cf_post_desc: "अपने शोध प्रबंध, निष्कर्ष या विश्लेषण का वर्णन करें...",
    cf_post_symbol: "संपत्ति प्रतीक (उदा. TCS) - वैकल्पिक",
    cf_attach_bt: "अंतिम बैकटेस्ट संलग्न करें",
    cf_btn_share: "पोस्ट साझा करें",
    cf_discussions: "नवीनतम चर्चाएँ",
    
    // Alerts
    al_dropdown_title: "मूल्य और पैटर्न अलर्ट",
    al_btn_create: "अलर्ट बनाएं",
    al_btn_check: "जांचें",
    al_status_active: "सक्रिय",
    al_status_triggered: "ट्रिगर हुआ",
    al_empty: "कोई अलर्ट कॉन्फ़िगर नहीं है।",
    al_modal_title: "अलर्ट बनाएं",
    al_symbol: "प्रतीक",
    al_type: "अलर्ट प्रकार",
    al_price_above: "कीमत ऊपर जाती है (>=)",
    al_price_below: "कीमत नीचे जाती है (<=)",
    al_pattern: "तकनीकी स्कैनर पैटर्न",
    al_target_price: "लक्ष्य मूल्य",
    al_pattern_name: "पैटर्न का नाम",
    al_btn_cancel: "रद्द करें",
    al_btn_confirm: "बनाएं",
  },
  es: {
    // Navigation
    nav_overview: "Resumen",
    nav_markets: "Mercados",
    nav_watchlist: "Favoritos",
    nav_portfolio: "Portafolio",
    nav_backtest: "Laboratorio",
    nav_community: "Comunidad",
    nav_predictions: "Predicciones",
    nav_news: "Noticias",
    nav_coach: "Entrenador AI",
    nav_learn: "Aprender",
    nav_settings: "Ajustes",
    
    // Overview Dashboard
    ov_welcome: "Bienvenido de nuevo",
    ov_sub: "Panel de inteligencia financiera en tiempo real potenciado por IA a su alcance.",
    ov_scanner: "Escáner Técnico",
    ov_indices: "Índices del Mercado",
    ov_gainers: "Mayores Ganancias",
    ov_losers: "Mayores Pérdidas",
    
    // Strategy Lab
    sl_title: "Laboratorio de Estrategias",
    sl_sub: "Realice backtests de estrategias cuantitativas en datos históricos",
    sl_config: "Configuración",
    sl_run: "Ejecutar Simulación",
    sl_simulating: "Simulando...",
    sl_net_return: "Retorno de Estrategia",
    sl_benchmark_return: "Retorno de Benchmark",
    sl_max_drawdown: "Máxima Caída",
    sl_win_rate: "Tasa de Éxito",
    sl_transactions: "Historial de Transacciones",
    
    // Community Feed
    cf_title: "Feed de la Comunidad",
    cf_sub: "Comparta resultados de backtests, ideas de trading y discuta sobre el mercado",
    cf_share: "Compartir Idea de Mercado",
    cf_post_title: "Título / Idea Principal",
    cf_post_desc: "Describa su tesis, hallazgos o análisis...",
    cf_post_symbol: "Símbolo (ej. TCS) - Opcional",
    cf_attach_bt: "Adjuntar Último Backtest",
    cf_btn_share: "Publicar",
    cf_discussions: "Últimas Discusiones",
    
    // Alerts
    al_dropdown_title: "Alertas de Precios y Patrones",
    al_btn_create: "Crear Alerta",
    al_btn_check: "Verificar",
    al_status_active: "Activa",
    al_status_triggered: "Activada",
    al_empty: "No hay alertas configuradas.",
    al_modal_title: "Crear Alerta",
    al_symbol: "Símbolo",
    al_type: "Tipo de Alerta",
    al_price_above: "Precio sube de (>=)",
    al_price_below: "Precio baja de (<=)",
    al_pattern: "Patrón de Escáner Técnico",
    al_target_price: "Precio Objetivo",
    al_pattern_name: "Nombre del Patrón",
    al_btn_cancel: "Cancelar",
    al_btn_confirm: "Crear",
  },
  de: {
    // Navigation
    nav_overview: "Übersicht",
    nav_markets: "Märkte",
    nav_watchlist: "Beobachtung",
    nav_portfolio: "Portfolio",
    nav_backtest: "Strategie-Lab",
    nav_community: "Community",
    nav_predictions: "KI-Prognosen",
    nav_news: "News",
    nav_coach: "KI-Coach",
    nav_learn: "Lernen",
    nav_settings: "Einstellungen",
    
    // Overview Dashboard
    ov_welcome: "Willkommen zurück",
    ov_sub: "Echtzeit-KI-gestütztes Finanz-Dashboard direkt auf Knopfdruck.",
    ov_scanner: "Technischer Scanner",
    ov_indices: "Markt-Indizes",
    ov_gainers: "Top Gewinner",
    ov_losers: "Top Verlierer",
    
    // Strategy Lab
    sl_title: "Strategie-Lab",
    sl_sub: "Backtest von quantitativen Handelsstrategien auf historischen Daten",
    sl_config: "Konfiguration",
    sl_run: "Simulation starten",
    sl_simulating: "Simuliere...",
    sl_net_return: "Netto-Rendite",
    sl_benchmark_return: "Benchmark-Rendite",
    sl_max_drawdown: "Max. Drawdown",
    sl_win_rate: "Erfolgsquote",
    sl_transactions: "Transaktionsverlauf",
    
    // Community Feed
    cf_title: "Community-Feed",
    cf_sub: "Teilen Sie Backtest-Ergebnisse, Trading-Ideen und diskutieren Sie Marktanalysen",
    cf_share: "Marktanalyse teilen",
    cf_post_title: "Titel / Kernidee",
    cf_post_desc: "Beschreiben Sie Ihre These, Ergebnisse oder Analyse...",
    cf_post_symbol: "Symbol (z.B. TCS) - Optional",
    cf_attach_bt: "Letzten Backtest anhängen",
    cf_btn_share: "Beitrag teilen",
    cf_discussions: "Neueste Diskussionen",
    
    // Alerts
    al_dropdown_title: "Preis- und Signal-Warnungen",
    al_btn_create: "Alarm erstellen",
    al_btn_check: "Prüfen",
    al_status_active: "Aktiv",
    al_status_triggered: "Ausgelöst",
    al_empty: "Keine Alarme konfiguriert.",
    al_modal_title: "Alarm erstellen",
    al_symbol: "Symbol",
    al_type: "Alarmtyp",
    al_price_above: "Preis steigt über (>=)",
    al_price_below: "Preis fällt unter (<=)",
    al_pattern: "Technisches Scannersignal",
    al_target_price: "Zielpreis",
    al_pattern_name: "Signalname",
    al_btn_cancel: "Abbrechen",
    al_btn_confirm: "Erstellen",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>("en");

  useEffect(() => {
    const stored = localStorage.getItem("vedora_language") as LanguageType;
    if (stored && ["en", "hi", "es", "de"].includes(stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem("vedora_language", lang);

    // Also update settings in local storage user preferences if present
    const userData = localStorage.getItem("vedora_user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        parsed.preferred_language = lang;
        localStorage.setItem("vedora_user", JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS["en"];
    return dict[key] || TRANSLATIONS["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
