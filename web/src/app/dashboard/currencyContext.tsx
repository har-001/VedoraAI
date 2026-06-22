"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type CurrencyType = "INR" | "USD" | "EUR" | "GBP";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  convertPrice: (inrVal: number) => number;
  formatPrice: (inrVal: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const RATES: Record<CurrencyType, number> = {
  INR: 1.0,
  USD: 1 / 83.0,
  EUR: 1 / 90.0,
  GBP: 1 / 106.0,
};

const SYMBOLS: Record<CurrencyType, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyType>("INR");

  useEffect(() => {
    const stored = localStorage.getItem("vedora_currency") as CurrencyType;
    if (stored && ["INR", "USD", "EUR", "GBP"].includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (curr: CurrencyType) => {
    setCurrencyState(curr);
    localStorage.setItem("vedora_currency", curr);
    
    // Also update settings in local storage user preferences if present
    const userData = localStorage.getItem("vedora_user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        parsed.preferred_currency = curr;
        localStorage.setItem("vedora_user", JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const convertPrice = (inrVal: number): number => {
    if (isNaN(inrVal) || inrVal === null || inrVal === undefined) return 0;
    const rate = RATES[currency];
    return inrVal * rate;
  };

  const formatPrice = (inrVal: number): string => {
    const symbol = SYMBOLS[currency];
    const converted = convertPrice(inrVal);
    
    // Display with 2 decimal places unless it is extremely small
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
