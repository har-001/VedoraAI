"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { MarketQuote, SectorData } from "@/lib/api";

export default function DashboardOverview() {
  const [user, setUser] = useState<{ full_name: string } | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [indices, setIndices] = useState<MarketQuote[]>([]);
  const [gainers, setGainers] = useState<MarketQuote[]>([]);
  const [losers, setLosers] = useState<MarketQuote[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [watchlist, setWatchlist] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Dashboard — VedoraAI";
    const userData = localStorage.getItem("vedora_user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { /* ignore */ }
    }
    requestAnimationFrame(() => setAnimateIn(true));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market overview
      const overviewRes = await api.getMarketOverview();
      if (overviewRes.ok && overviewRes.data) {
        setIndices(overviewRes.data.indices || []);
        setGainers(overviewRes.data.top_gainers || []);
        setLosers(overviewRes.data.top_losers || []);
      }

      // Fetch sector performance
      const sectorsRes = await api.getSectorPerformance();
      if (sectorsRes.ok && sectorsRes.data) {
        setSectors(sectorsRes.data || []);
      }

      // Fetch watchlist
      const watchlistRes = await api.listWatchlists();
      if (watchlistRes.ok && watchlistRes.data && watchlistRes.data.length > 0) {
        const defaultWatchlist = watchlistRes.data.find(w => w.is_default) || watchlistRes.data[0];
        if (defaultWatchlist.items && defaultWatchlist.items.length > 0) {
          const symbols = defaultWatchlist.items.map(i => i.symbol);
          const quotesRes = await api.getMultipleQuotes(symbols);
          if (quotesRes.ok && quotesRes.data) {
            setWatchlist(quotesRes.data);
          }
        } else {
          // Default symbols if empty
          const quotesRes = await api.getMultipleQuotes(["RELIANCE", "TCS", "INFY"]);
          if (quotesRes.ok && quotesRes.data) {
            setWatchlist(quotesRes.data);
          }
        }
      } else {
        // Fallback default symbols
        const quotesRes = await api.getMultipleQuotes(["RELIANCE", "TCS", "INFY"]);
        if (quotesRes.ok && quotesRes.data) {
          setWatchlist(quotesRes.data);
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch live market data.");
    } finally {
      setLoading(false);
    }
  };

  const outlookColor = (outlook: string) => {
    if (outlook === "Bullish") return "var(--bullish)";
    if (outlook === "Bearish") return "var(--bearish)";
    return "var(--neutral-color)";
  };

  const mockPredictions = [
    { symbol: "RELIANCE", confidence: 82, outlook: "Bullish", risk: "Moderate", target: "₹1,550 — ₹1,620" },
    { symbol: "NIFTY50", confidence: 71, outlook: "Neutral", risk: "Low", target: "22,400 — 22,800" },
    { symbol: "BHARTIARTL", confidence: 88, outlook: "Bullish", risk: "Low", target: "₹1,720 — ₹1,850" },
    { symbol: "TCS", confidence: 65, outlook: "Bearish", risk: "High", target: "₹3,300 — ₹3,500" },
  ];

  const mockNews = [
    { title: "RBI keeps repo rate unchanged at 6.5%", time: "2h ago", impact: "neutral", source: "ET" },
    { title: "Reliance Q3 profit rises 18% on Jio growth", time: "4h ago", impact: "bullish", source: "NDTV" },
    { title: "IT sector outlook bright for FY25: Analysts", time: "6h ago", impact: "bullish", source: "MC" },
  ];

  return (
    <div className={`dashboard-overview ${animateIn ? "visible" : ""}`}>
      {/* ── Welcome Banner ─────────────────────── */}
      <section className="dash-welcome">
        <div>
          <h1 className="dash-welcome-title">
            Welcome back, <span className="gradient-text">{user?.full_name || "User"}</span> 👋
          </h1>
          <p className="dash-welcome-sub">Here&apos;s your AI market intelligence overview</p>
        </div>
        <div className="dash-welcome-actions">
          <Link href="/dashboard/predictions" className="btn btn-primary btn-sm">
            🤖 AI Predictions
          </Link>
          <Link href="/dashboard/coach" className="btn btn-secondary btn-sm">
            🧠 Ask AI Coach
          </Link>
        </div>
      </section>

      {/* ── Stat Cards Row ─────────────────────── */}
      <section className="dash-stats-grid">
        {[
          { label: "Portfolio Value", value: "₹2,45,000", change: "+2.4%", positive: true, icon: "💰" },
          { label: "AI Predictions", value: "23 Active", change: "82% accuracy", positive: true, icon: "🤖" },
          { label: "Market Mood", value: "Bullish", change: "NIFTY +0.8%", positive: true, icon: "📈" },
          { label: "Risk Level", value: "Moderate", change: "3 alerts", positive: false, icon: "⚡" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="dash-stat-card"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="dash-stat-header">
              <span className="dash-stat-label">{stat.label}</span>
              <span className="dash-stat-icon">{stat.icon}</span>
            </div>
            <div className="dash-stat-value">{stat.value}</div>
            <span
              className="dash-stat-change"
              style={{ color: stat.positive ? "var(--bullish)" : "var(--neutral-color)" }}
            >
              {stat.change}
            </span>
          </div>
        ))}
      </section>

      {/* ── Market Indices ─────────────────────── */}
      <section className="dash-indices">
        <div className="dash-section-header">
          <h2 className="dash-section-title">📊 Market Indices</h2>
          <Link href="/dashboard/markets" className="dash-section-link">View All →</Link>
        </div>
        {loading ? (
          <div style={{ display: "flex", gap: 16 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="dash-index-card shimmer" style={{ height: 80, flex: 1 }} />
            ))}
          </div>
        ) : (
          <div className="dash-indices-grid">
            {indices.map((idx) => (
              <div key={idx.symbol} className="dash-index-card">
                <div className="dash-index-name">{idx.symbol.replace(".NS", "")}</div>
                <div className="dash-index-price">
                  ₹{idx.current_price?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <div
                  className="dash-index-change"
                  style={{ color: idx.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                >
                  {idx.change_percent >= 0 ? "▲" : "▼"} {Math.abs(idx.change).toFixed(2)} ({Math.abs(idx.change_percent).toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Main Grid: Predictions + Watchlist + Sectors ── */}
      <div className="dash-main-grid">
        {/* ── AI Predictions Panel ───────────── */}
        <section className="dash-panel dash-predictions-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">🤖 AI Predictions</h2>
            <Link href="/dashboard/predictions" className="dash-section-link">View All →</Link>
          </div>
          <div className="dash-predictions-list">
            {mockPredictions.map((pred) => (
              <div key={pred.symbol} className="dash-prediction-item">
                <div className="dash-prediction-left">
                  <div className="dash-prediction-symbol">{pred.symbol}</div>
                  <div className="dash-prediction-target">Target: {pred.target}</div>
                </div>
                <div className="dash-prediction-right">
                  <div className="dash-prediction-confidence">
                    <div className="dash-confidence-bar">
                      <div
                        className="dash-confidence-fill"
                        style={{
                          width: `${pred.confidence}%`,
                          background: `linear-gradient(90deg, ${outlookColor(pred.outlook)}, ${outlookColor(pred.outlook)}88)`,
                        }}
                      />
                    </div>
                    <span className="dash-confidence-value" style={{ color: outlookColor(pred.outlook) }}>
                      {pred.confidence}%
                    </span>
                  </div>
                  <span className={`dash-badge dash-badge-${pred.outlook.toLowerCase()}`}>
                    {pred.outlook}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Watchlist Panel ────────────────── */}
        <section className="dash-panel dash-watchlist-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">⭐ Watchlist</h2>
            <Link href="/dashboard/watchlist" className="dash-section-link">Manage →</Link>
          </div>
          <div className="dash-watchlist-list">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="shimmer" style={{ height: 50, borderRadius: 8, marginBottom: 8 }} />
              ))
            ) : watchlist.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 13 }}>
                Watchlist is empty
              </div>
            ) : (
              watchlist.map((item) => (
                <div key={item.symbol} className="dash-watchlist-item">
                  <div className="dash-watchlist-left">
                    <div className="dash-watchlist-symbol">{item.symbol.replace(".NS", "")}</div>
                    <div className="dash-watchlist-name">{item.name}</div>
                  </div>
                  <div className="dash-watchlist-right">
                    <div className="dash-watchlist-price">₹{item.current_price?.toLocaleString("en-IN")}</div>
                    <div
                      className="dash-watchlist-change"
                      style={{ color: item.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                    >
                      {item.change_percent >= 0 ? "+" : ""}{item.change_percent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Sector Performance ─────────────── */}
        <section className="dash-panel dash-sectors-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">🏭 Sectors</h2>
            <Link href="/dashboard/markets" className="dash-section-link">Details →</Link>
          </div>
          <div className="dash-sectors-list">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="shimmer" style={{ height: 25, borderRadius: 6, marginBottom: 8 }} />
              ))
            ) : (
              sectors.slice(0, 6).map((sector) => (
                <div key={sector.name} className="dash-sector-item">
                  <span className="dash-sector-name">{sector.name}</span>
                  <div className="dash-sector-bar-wrapper">
                    <div
                      className="dash-sector-bar"
                      style={{
                        width: `${Math.min(Math.abs(sector.change_percent) * 15, 100)}%`,
                        background: sector.change_percent >= 0
                          ? "linear-gradient(90deg, rgba(0,230,118,0.3), var(--bullish))"
                          : "linear-gradient(90deg, rgba(255,82,82,0.3), var(--bearish))",
                      }}
                    />
                  </div>
                  <span
                    className="dash-sector-change"
                    style={{ color: sector.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                  >
                    {sector.change_percent >= 0 ? "+" : ""}{sector.change_percent?.toFixed(2)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Bottom Row: Top Movers + News ────── */}
      <div className="dash-bottom-grid">
        {/* Top Gainers */}
        <section className="dash-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">🚀 Top Gainers</h2>
          </div>
          <div className="dash-movers-list">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="shimmer" style={{ height: 45, borderRadius: 8, marginBottom: 8 }} />
              ))
            ) : (
              gainers.slice(0, 5).map((stock, i) => (
                <div key={stock.symbol} className="dash-mover-item">
                  <span className="dash-mover-rank">{i + 1}</span>
                  <div className="dash-mover-info">
                    <span className="dash-mover-symbol">{stock.symbol.replace(".NS", "")}</span>
                    <span className="dash-mover-name">{stock.name}</span>
                  </div>
                  <div className="dash-mover-right">
                    <span className="dash-mover-price">₹{stock.current_price?.toLocaleString("en-IN")}</span>
                    <span className="dash-mover-change" style={{ color: "var(--bullish)" }}>
                      +{stock.change_percent?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top Losers */}
        <section className="dash-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">📉 Top Losers</h2>
          </div>
          <div className="dash-movers-list">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="shimmer" style={{ height: 45, borderRadius: 8, marginBottom: 8 }} />
              ))
            ) : (
              losers.slice(0, 5).map((stock, i) => (
                <div key={stock.symbol} className="dash-mover-item">
                  <span className="dash-mover-rank">{i + 1}</span>
                  <div className="dash-mover-info">
                    <span className="dash-mover-symbol">{stock.symbol.replace(".NS", "")}</span>
                    <span className="dash-mover-name">{stock.name}</span>
                  </div>
                  <div className="dash-mover-right">
                    <span className="dash-mover-price">₹{stock.current_price?.toLocaleString("en-IN")}</span>
                    <span className="dash-mover-change" style={{ color: "var(--bearish)" }}>
                      {stock.change_percent?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* News */}
        <section className="dash-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">📰 Latest News</h2>
            <Link href="/dashboard/news" className="dash-section-link">More →</Link>
          </div>
          <div className="dash-news-list">
            {mockNews.map((news) => (
              <div key={news.title} className="dash-news-item">
                <div className="dash-news-content">
                  <span className={`dash-news-dot ${news.impact}`} />
                  <span className="dash-news-title">{news.title}</span>
                </div>
                <div className="dash-news-meta">
                  <span className="dash-news-source">{news.source}</span>
                  <span className="dash-news-time">{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Quick Actions ──────────────────────── */}
      <section className="dash-quick-actions">
        {[
          { icon: "📊", label: "Market Scanner", desc: "Scan all assets", href: "/dashboard/markets" },
          { icon: "🧠", label: "AI Coach", desc: "Ask anything", href: "/dashboard/coach" },
          { icon: "📰", label: "News Center", desc: "Market updates", href: "/dashboard/news" },
          { icon: "🎓", label: "Learning Hub", desc: "Start learning", href: "/dashboard/learn" },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="dash-quick-action-card">
            <div className="dash-quick-action-icon">{action.icon}</div>
            <div className="dash-quick-action-label">{action.label}</div>
            <div className="dash-quick-action-desc">{action.desc}</div>
          </Link>
        ))}
      </section>

      {/* ── Disclaimer ─────────────────────────── */}
      <div className="dash-disclaimer">
        ⚠️ VedoraAI provides AI-generated probabilistic estimates for research and educational purposes.
        This is not financial advice. Always do your own research before making investment decisions.
      </div>
    </div>
  );
}
