"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../languageContext";
import { useCurrency } from "../currencyContext";
import api from "@/lib/api";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<{ full_name: string; email: string; subscription_tier?: string } | null>(null);

  useEffect(() => {
    document.title = "Settings — VedoraAI";
    const userData = localStorage.getItem("vedora_user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { /* ignore */ }
    }
    
    // Fetch latest user details from API
    const fetchProfile = async () => {
      try {
        const res = await api.getProfile();
        if (res.ok && res.data) {
          setUser(res.data as any);
          localStorage.setItem("vedora_user", JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Failed to fetch settings profile", err);
      }
    };
    fetchProfile();
  }, []);
  const [notifications, setNotifications] = useState({
    predictions: true,
    priceAlerts: true,
    news: false,
    community: false,
    email: true,
  });
  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleDowngrade = async () => {
    if (confirm("Are you sure you want to downgrade to the Free plan? (For testing purposes)")) {
      try {
        const res = await api.post("/users/me/downgrade");
        if (res.ok) {
          alert("Downgraded to Free Plan successfully!");
          // Fetch updated profile
          const profileRes = await api.getProfile();
          if (profileRes.ok && profileRes.data) {
            setUser(profileRes.data as any);
            localStorage.setItem("vedora_user", JSON.stringify(profileRes.data));
            window.location.reload();
          }
        } else {
          alert("Failed to downgrade: " + (res.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error downgrading");
      }
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 className="dash-welcome-title" style={{ marginBottom: 24 }}>
        ⚙️ Settings
      </h1>

      {/* Profile Section */}
      <section className="dash-panel" style={{ marginBottom: 20 }}>
        <h2 className="dash-section-title" style={{ marginBottom: 16 }}>Profile</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "white",
            }}
          >
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.full_name || "User"}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user?.email || "—"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
              <span style={{ fontSize: 11, color: user?.subscription_tier === "pro" ? "#f1c40f" : "var(--primary-light)", fontWeight: 700 }}>
                {user?.subscription_tier === "pro" ? "⚡ PRO PLAN MEMBER" : "FREE PLAN"}
              </span>
              {user?.subscription_tier === "pro" ? (
                <button
                  onClick={handleDowngrade}
                  style={{
                    background: "rgba(255, 82, 82, 0.15)",
                    border: "1px solid rgba(255, 82, 82, 0.3)",
                    borderRadius: 4,
                    color: "var(--bearish)",
                    fontSize: 10,
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Downgrade (Test)
                </button>
              ) : (
                <Link
                  href="/dashboard/upgrade"
                  style={{
                    background: "linear-gradient(90deg, var(--primary), var(--secondary))",
                    border: "none",
                    borderRadius: 4,
                    color: "white",
                    fontSize: 10,
                    padding: "3px 8px",
                    cursor: "pointer",
                    textDecoration: "none",
                    fontWeight: 700,
                    boxShadow: "0 0 10px rgba(108, 92, 231, 0.3)",
                  }}
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="cut-input-group">
            <input className="input" defaultValue={user?.full_name || ""} id="settings-name" />
            <label htmlFor="settings-name" className="input-label">Full Name</label>
          </div>
          <div className="cut-input-group">
            <input className="input" defaultValue={user?.email || ""} id="settings-email" disabled
              style={{ opacity: 0.6 }} />
            <label htmlFor="settings-email" className="input-label">Email</label>
          </div>
        </div>
      </section>

      {/* Theme Section */}
      <section className="dash-panel" style={{ marginBottom: 20 }}>
        <h2 className="dash-section-title" style={{ marginBottom: 16 }}>Appearance</h2>
        <div style={{ display: "flex", gap: 12 }}>
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => toggleTheme(t)}
              style={{
                flex: 1,
                padding: "16px 20px",
                borderRadius: "var(--radius-lg)",
                border: `2px solid ${theme === t ? "var(--primary)" : "var(--border)"}`,
                background: theme === t
                  ? "linear-gradient(135deg, rgba(108,92,231,0.12), rgba(0,210,255,0.06))"
                  : "var(--surface)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
                color: "var(--text-primary)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{t === "dark" ? "🌙" : "☀️"}</div>
              <div style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{t} Mode</div>
              {theme === t && (
                <div style={{ fontSize: 11, color: "var(--primary-light)", marginTop: 4, fontWeight: 600 }}>
                  Active
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="dash-panel" style={{ marginBottom: 20 }}>
        <h2 className="dash-section-title" style={{ marginBottom: 16 }}>Notifications</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(notifications).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--card)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>
                  {key.replace(/([A-Z])/g, " $1")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {key === "predictions" && "Get notified when new AI predictions are available"}
                  {key === "priceAlerts" && "Alerts when watchlist assets hit target prices"}
                  {key === "news" && "Breaking market news notifications"}
                  {key === "community" && "Community mentions and replies"}
                  {key === "email" && "Receive weekly digest emails"}
                </div>
              </div>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [key]: !value }))}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 24,
                  border: "none",
                  background: value
                    ? "linear-gradient(90deg, var(--primary), var(--secondary))"
                    : "var(--border)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.3s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: value ? 23 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Global Preferences */}
      <section className="dash-panel" style={{ marginBottom: 20 }}>
        <h2 className="dash-section-title" style={{ marginBottom: 16 }}>Global Preferences</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div className="cut-input-group">
            <select className="input" id="settings-market" defaultValue="NSE">
              <option value="NSE">NSE (India)</option>
              <option value="BSE">BSE (India)</option>
              <option value="NASDAQ">NASDAQ (US)</option>
              <option value="NYSE">NYSE (US)</option>
            </select>
            <label htmlFor="settings-market" className="input-label">Primary Market</label>
          </div>
          <div className="cut-input-group">
            <select
              className="input"
              id="settings-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
            <label htmlFor="settings-currency" className="input-label">Currency</label>
          </div>
          <div className="cut-input-group">
            <select
              className="input"
              id="settings-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="es">Español (ES)</option>
              <option value="de">Deutsch (DE)</option>
            </select>
            <label htmlFor="settings-language" className="input-label">Language</label>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="dash-panel" style={{ borderColor: "rgba(255, 82, 82, 0.15)" }}>
        <h2 className="dash-section-title" style={{ marginBottom: 16, color: "var(--bearish)" }}>
          ⚠️ Danger Zone
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary btn-sm">Export Data</button>
          <button
            className="btn btn-sm"
            style={{
              background: "var(--bearish-bg)",
              color: "var(--bearish)",
              border: "1px solid rgba(255,82,82,0.2)",
            }}
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
