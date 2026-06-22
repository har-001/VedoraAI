"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "./languageContext";

interface Step {
  selector: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right";
}

export const TourGuide: React.FC = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const steps: Step[] = [
    {
      selector: ".dash-welcome",
      title: "👋 Welcome to VedoraAI",
      description: "This is your core dashboard overview. Here you can inspect indices, sector health, and navigate to AI features.",
      position: "bottom",
    },
    {
      selector: ".dash-stats-grid",
      title: "📈 Real-Time Indices",
      description: "Track NIFTY 50, SENSEX, and BANK NIFTY quotes instantly, compiled directly from market providers.",
      position: "bottom",
    },
    {
      selector: "#notifications-btn",
      title: "🔔 Real-Time Price & Pattern Alerts",
      description: "Click here to set price targets or technical indicator pattern alerts. You'll get notified immediately when conditions are met!",
      position: "bottom",
    },
    {
      selector: ".sidebar-brand",
      title: "👥 Navigation Menu",
      description: "Jump to the Strategy Lab to test custom trading rules, read Interactive Learn lessons, or discuss with the Community.",
      position: "right",
    },
  ];

  useEffect(() => {
    const tourCompleted = localStorage.getItem("vedora_tour_completed");
    // Show tour if not completed and we are on the dashboard overview home page
    if (tourCompleted !== "true" && window.location.pathname === "/dashboard") {
      // Small delay to make sure DOM is fully loaded and layout has stabilized
      const timer = setTimeout(() => {
        setVisible(true);
        updatePosition(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = (stepIdx: number) => {
    const step = steps[stepIdx];
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (!el) {
      // Element not found on current page, try fallback or default middle of screen
      setCoords({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
      return;
    }

    // Scroll to the element smoothly
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      if (step.position === "bottom") {
        top = rect.bottom + scrollY + 12;
        left = rect.left + scrollX + rect.width / 2 - 150; // Center tooltip
      } else if (step.position === "top") {
        top = rect.top + scrollY - 180;
        left = rect.left + scrollX + rect.width / 2 - 150;
      } else if (step.position === "right") {
        top = rect.top + scrollY + rect.height / 2 - 80;
        left = rect.right + scrollX + 12;
      } else {
        top = rect.top + scrollY + rect.height / 2 - 80;
        left = rect.left + scrollX - 320;
      }

      // Constrain inside window viewport
      left = Math.max(10, Math.min(left, window.innerWidth - 330));
      top = Math.max(10, top);

      setCoords({ top, left });
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      updatePosition(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      updatePosition(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setVisible(false);
    localStorage.setItem("vedora_tour_completed", "true");
  };

  if (!visible) return null;

  return (
    <>
      {/* Spotlight highlight overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
          pointerEvents: "none",
        }}
      />

      {/* Floating Tour Tooltip */}
      <div
        style={{
          position: "absolute",
          top: coords.top,
          left: coords.left,
          width: 300,
          background: "rgba(19, 23, 64, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--primary)",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.6), 0 0 15px rgba(108, 92, 231, 0.2)",
          zIndex: 9999,
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          transition: "top 0.3s ease, left 0.3s ease",
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Guide • Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleComplete}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
            >
              ✕
            </button>
          </div>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: "6px 0 4px 0" }}>
            {steps[currentStep].title}
          </h4>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            {steps[currentStep].description}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <button
            onClick={handleComplete}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            Skip Guide
          </button>
          
          <div style={{ display: "flex", gap: 8 }}>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                background: "var(--primary)",
                border: "none",
                borderRadius: 6,
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              {currentStep === steps.length - 1 ? "Got it!" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
