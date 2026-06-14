"use client";

import { useEffect, useState, useCallback } from "react";
import api, { NewsArticle } from "@/lib/api";

const CATEGORIES = ["All", "Markets", "Earnings", "Policy", "Tech", "Banking", "Auto", "Pharma", "Commodities", "General"];
const SENTIMENTS = ["All", "Bullish", "Bearish", "Neutral"];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallSentiment, setOverallSentiment] = useState<string>("neutral");
  const [sentimentScore, setSentimentScore] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSentiment, setSelectedSentiment] = useState("All");

  const fetchNews = useCallback(async () => {
    try {
      setError(null);
      const result = await api.getMarketNews(30);
      if (result.ok && result.data?.articles) {
        setArticles(result.data.articles);
        setOverallSentiment(result.data.overall_sentiment || "neutral");
        setSentimentScore(result.data.sentiment_score || 0);
      } else {
        setError(result.error || "Failed to load news");
      }
    } catch {
      setError("Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "News — VedoraAI";
    fetchNews();
    // Refresh every 10 minutes
    const interval = setInterval(fetchNews, 600000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // Filtered articles
  const filtered = articles.filter((a) => {
    const catMatch = selectedCategory === "All" || a.category === selectedCategory;
    const sentMatch = selectedSentiment === "All" || a.impact === selectedSentiment.toLowerCase();
    return catMatch && sentMatch;
  });

  const impactStyle = (impact: string) => ({
    color: impact === "bullish" ? "var(--bullish)" : impact === "bearish" ? "var(--bearish)" : "var(--neutral-color)",
    background: impact === "bullish" ? "var(--bullish-bg)" : impact === "bearish" ? "var(--bearish-bg)" : "var(--neutral-bg)",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
  });

  const sentimentBarColor = overallSentiment === "bullish" ? "var(--bullish)" : overallSentiment === "bearish" ? "var(--bearish)" : "var(--neutral-color)";

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 0" }}>
        <h1 className="dash-welcome-title" style={{ marginBottom: 8 }}>News Center</h1>
        <p className="dash-welcome-sub" style={{ marginBottom: 32 }}>Loading live news...</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="dash-panel"
              style={{
                height: 90,
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
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 className="dash-welcome-title">News Center</h1>
        <button
          onClick={() => { setLoading(true); fetchNews(); }}
          className="btn btn-sm"
          style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text-secondary)",
            cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </div>
      <p className="dash-welcome-sub" style={{ marginBottom: 16 }}>AI-curated market news with real-time sentiment analysis</p>

      {/* Sentiment Summary Bar */}
      <div
        className="dash-panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          marginBottom: 16,
          borderColor: sentimentBarColor,
          borderWidth: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Market Sentiment:</span>
          <span style={{
            ...impactStyle(overallSentiment),
            fontSize: 12,
            padding: "3px 12px",
          }}>
            {overallSentiment}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>Score:</span>
          <span style={{
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: sentimentScore > 0 ? "var(--bullish)" : sentimentScore < 0 ? "var(--bearish)" : "var(--text-secondary)",
          }}>
            {sentimentScore > 0 ? "+" : ""}{sentimentScore.toFixed(3)}
          </span>
          <span style={{ color: "var(--text-muted)" }}>|</span>
          <span style={{ color: "var(--text-muted)" }}>{articles.length} articles</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Category filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "4px 12px",
                borderRadius: 16,
                border: "1px solid",
                borderColor: selectedCategory === cat ? "var(--primary)" : "var(--border)",
                background: selectedCategory === cat ? "var(--primary)" : "transparent",
                color: selectedCategory === cat ? "white" : "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Sentiment filter */}
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSentiment(s)}
              style={{
                padding: "4px 10px",
                borderRadius: 16,
                border: "1px solid",
                borderColor: selectedSentiment === s ? "var(--primary)" : "var(--border)",
                background: selectedSentiment === s ? "var(--primary)" : "transparent",
                color: selectedSentiment === s ? "white" : "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="dash-panel" style={{
          background: "var(--bearish-bg)", borderColor: "var(--bearish)",
          marginBottom: 16, padding: "12px 16px", color: "var(--bearish)", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* News Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.length === 0 && !error && (
          <div className="dash-panel" style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
            No articles match the selected filters.
          </div>
        )}
        {filtered.map((n, idx) => (
          <a
            key={idx}
            href={n.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="dash-panel"
              style={{ cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, flex: 1 }}>{n.title}</h3>
                <span style={impactStyle(n.impact)}>{n.impact}</span>
              </div>
              {n.summary && n.summary !== n.title && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
                  {n.summary.slice(0, 200)}{n.summary.length > 200 ? "..." : ""}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: "var(--primary-light)" }}>{n.source}</span>
                <span style={{ color: "var(--text-muted)" }}>{n.time_ago}</span>
                <span style={{
                  padding: "1px 8px", borderRadius: 10,
                  background: "var(--card)", color: "var(--text-tertiary)", fontSize: 11,
                }}>
                  {n.category}
                </span>
                {/* Sentiment score bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                  <div style={{
                    width: 40, height: 4, borderRadius: 2,
                    background: "var(--border)",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute",
                      left: n.sentiment.score >= 0 ? "50%" : `${50 + n.sentiment.score * 50}%`,
                      width: `${Math.abs(n.sentiment.score) * 50}%`,
                      height: "100%",
                      background: n.sentiment.score > 0 ? "var(--bullish)" : "var(--bearish)",
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: n.sentiment.score > 0 ? "var(--bullish)" : n.sentiment.score < 0 ? "var(--bearish)" : "var(--text-muted)",
                  }}>
                    {n.sentiment.score > 0 ? "+" : ""}{n.sentiment.score.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
