"use client";

import { useEffect, useState, useCallback } from "react";
import api, { PredictionData } from "@/lib/api";

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchPredictions = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getPredictions(12);
      if (result.ok && result.data?.predictions) {
        setPredictions(result.data.predictions.filter((p) => !p.error));
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError(result.error || "Failed to load predictions");
      }
    } catch (err) {
      setError("Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "AI Predictions — VedoraAI";
    fetchPredictions();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchPredictions, 300000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  const outlookColor = (o: string) =>
    o === "Bullish" ? "var(--bullish)" : o === "Bearish" ? "var(--bearish)" : "var(--neutral-color)";

  const outlookBg = (o: string) =>
    o === "Bullish" ? "var(--bullish-bg)" : o === "Bearish" ? "var(--bearish-bg)" : "var(--neutral-bg)";

  const riskColor = (r: string) =>
    r === "Low" ? "var(--bullish)" : r === "High" ? "var(--bearish)" : "var(--neutral-color)";

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 0" }}>
        <h1 className="dash-welcome-title" style={{ marginBottom: 8 }}>AI Predictions</h1>
        <p className="dash-welcome-sub" style={{ marginBottom: 32 }}>Analyzing market data with AI...</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="dash-panel"
              style={{
                height: 80,
                background: "var(--surface)",
                animation: "pulse-glow 1.5s ease-in-out infinite",
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 className="dash-welcome-title">AI Predictions</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Updated: {lastUpdated}</span>
          )}
          <button
            onClick={() => { setLoading(true); fetchPredictions(); }}
            className="btn btn-sm"
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      <p className="dash-welcome-sub" style={{ marginBottom: 24 }}>
        AI-generated probabilistic market signals powered by XGBoost + Technical Analysis
      </p>

      {error && (
        <div
          className="dash-panel"
          style={{
            background: "var(--bearish-bg)",
            borderColor: "var(--bearish)",
            marginBottom: 16,
            padding: "12px 16px",
            color: "var(--bearish)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {predictions.map((pred) => (
          <div
            key={pred.symbol}
            className="dash-panel"
            style={{
              cursor: "pointer",
              transition: "all 0.25s",
              borderColor: expanded === pred.symbol ? "var(--primary)" : "var(--border)",
            }}
            onClick={() => setExpanded(expanded === pred.symbol ? null : pred.symbol)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{pred.symbol}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Rs.{pred.current_price?.toLocaleString()} · {pred.horizon}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Confidence meter */}
                <div style={{ textAlign: "center", position: "relative" }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke={outlookColor(pred.outlook)}
                      strokeWidth="4"
                      strokeDasharray={`${(pred.confidence / 100) * 125.6} 125.6`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
                    color: outlookColor(pred.outlook),
                  }}>
                    {pred.confidence}%
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: outlookBg(pred.outlook),
                    color: outlookColor(pred.outlook),
                  }}
                >
                  {pred.outlook}
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: pred.risk === "Low" ? "var(--bullish-bg)" : pred.risk === "High" ? "var(--bearish-bg)" : "var(--neutral-bg)",
                    color: riskColor(pred.risk),
                  }}
                >
                  {pred.risk} Risk
                </span>
              </div>
            </div>

            {expanded === pred.symbol && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 14, borderRadius: 10, background: "var(--card)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Target Range</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{pred.target}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: "var(--card)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Model Accuracy</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--primary-light)" }}>
                      {pred.model_accuracy}%
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: "var(--card)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Bullish Probability</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: outlookColor(pred.outlook) }}>
                      {pred.bullish_probability}%
                    </div>
                  </div>
                </div>

                {/* Technical Indicators */}
                {pred.indicators && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    {pred.indicators.rsi !== null && (
                      <div style={{
                        padding: "6px 12px", borderRadius: 8, background: "var(--card)",
                        fontSize: 12, display: "flex", gap: 6, alignItems: "center",
                      }}>
                        <span style={{ color: "var(--text-muted)" }}>RSI</span>
                        <span style={{
                          fontWeight: 700, fontFamily: "var(--font-mono)",
                          color: pred.indicators.rsi < 30 ? "var(--bullish)" : pred.indicators.rsi > 70 ? "var(--bearish)" : "var(--text-primary)",
                        }}>
                          {pred.indicators.rsi}
                        </span>
                      </div>
                    )}
                    {pred.indicators.macd !== null && (
                      <div style={{
                        padding: "6px 12px", borderRadius: 8, background: "var(--card)",
                        fontSize: 12, display: "flex", gap: 6, alignItems: "center",
                      }}>
                        <span style={{ color: "var(--text-muted)" }}>MACD</span>
                        <span style={{
                          fontWeight: 700, fontFamily: "var(--font-mono)",
                          color: pred.indicators.macd > 0 ? "var(--bullish)" : "var(--bearish)",
                        }}>
                          {pred.indicators.macd}
                        </span>
                      </div>
                    )}
                    {pred.indicators.adx !== null && (
                      <div style={{
                        padding: "6px 12px", borderRadius: 8, background: "var(--card)",
                        fontSize: 12, display: "flex", gap: 6, alignItems: "center",
                      }}>
                        <span style={{ color: "var(--text-muted)" }}>ADX</span>
                        <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {pred.indicators.adx}
                        </span>
                      </div>
                    )}
                    {pred.indicators.atr !== null && (
                      <div style={{
                        padding: "6px 12px", borderRadius: 8, background: "var(--card)",
                        fontSize: 12, display: "flex", gap: 6, alignItems: "center",
                      }}>
                        <span style={{ color: "var(--text-muted)" }}>ATR</span>
                        <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {pred.indicators.atr}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Reasons */}
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 8 }}>
                  Key Signals:
                </div>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
                  {pred.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="dash-disclaimer" style={{ marginTop: 24 }}>
        Predictions are AI-generated probabilistic estimates using XGBoost + 30 technical indicators. For research purposes only — not financial advice.
      </div>
    </div>
  );
}
