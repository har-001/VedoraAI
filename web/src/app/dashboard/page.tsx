"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, {
  MarketQuote,
  SectorData,
  PortfolioAnalyticsResponse,
  PredictionData,
} from "@/lib/api";
import { useLanguage } from "./languageContext";
import { useCurrency } from "./currencyContext";

export default function DashboardOverview() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [user, setUser] = useState<{ full_name: string } | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [indices, setIndices] = useState<MarketQuote[]>([]);
  const [gainers, setGainers] = useState<MarketQuote[]>([]);
  const [losers, setLosers] = useState<MarketQuote[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [watchlist, setWatchlist] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 6 Revamp State
  const [heatmapStocks, setHeatmapStocks] = useState<MarketQuote[]>([]);
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
  const [featuredPrediction, setFeaturedPrediction] = useState<PredictionData | null>(null);
  const [tradeIdeas, setTradeIdeas] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Overview Dashboard — VedoraAI";
    const userData = localStorage.getItem("vedora_user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        /* ignore */
      }
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
        const defaultWatchlist = watchlistRes.data.find((w) => w.is_default) || watchlistRes.data[0];
        if (defaultWatchlist.items && defaultWatchlist.items.length > 0) {
          const symbols = defaultWatchlist.items.map((i) => i.symbol);
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

      // ── Phase 6 Loadings ──

      // 1. Popular stock quotes for Heatmap
      const popularRes = await api.getPopularStocks();
      if (popularRes.ok && popularRes.data) {
        setHeatmapStocks(popularRes.data);
      } else {
        const fallbackRes = await api.getMultipleQuotes([
          "RELIANCE",
          "TCS",
          "INFY",
          "HDFCBANK",
          "ICICIBANK",
          "SBIN",
          "TATAMOTORS",
          "BHARTIARTL",
        ]);
        if (fallbackRes.ok && fallbackRes.data) {
          setHeatmapStocks(fallbackRes.data);
        }
      }

      // 2. Portfolio analytics
      const portList = await api.listPortfolios();
      if (portList.ok && portList.data && portList.data.length > 0) {
        const defPort = portList.data.find((p) => p.is_default) || portList.data[0];
        const portAnalyticsRes = await api.getPortfolioAnalytics(defPort.id);
        if (portAnalyticsRes.ok && portAnalyticsRes.data) {
          setPortfolioAnalytics(portAnalyticsRes.data);
        }
      }

      // 3. Featured prediction
      const predictionsRes = await api.getPredictions(5);
      if (predictionsRes.ok && predictionsRes.data && predictionsRes.data.predictions.length > 0) {
        // Find highest confidence prediction
        const sorted = [...predictionsRes.data.predictions].sort((a, b) => b.confidence - a.confidence);
        setFeaturedPrediction(sorted[0]);
      }

      // 4. Trade ideas from scanner
      const scanRes = await api.getMarketScan();
      if (scanRes.ok && scanRes.data && scanRes.data.results.length > 0) {
        const itemsWithSignals = scanRes.data.results
          .filter((item) => item.signals.length > 0)
          .slice(0, 3);
        setTradeIdeas(itemsWithSignals);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch live market data.");
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (changePct: number) => {
    if (changePct > 0) {
      // Positive: green intensity
      const opacity = Math.max(0.12, Math.min(0.1 + changePct * 0.2, 0.95));
      return {
        background: `rgba(0, 230, 118, ${opacity})`,
        border: "1px solid rgba(0, 230, 118, 0.35)",
        color: "#ffffff",
      };
    } else if (changePct < 0) {
      // Negative: red intensity
      const opacity = Math.max(0.12, Math.min(0.1 + Math.abs(changePct) * 0.2, 0.95));
      return {
        background: `rgba(255, 82, 82, ${opacity})`,
        border: "1px solid rgba(255, 82, 82, 0.35)",
        color: "#ffffff",
      };
    }
    return {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text-secondary)",
    };
  };

  const renderPortfolioMiniSparkline = () => {
    if (!portfolioAnalytics || portfolioAnalytics.allocation.length === 0) return null;
    const isProfit = portfolioAnalytics.total_pnl >= 0;
    return (
      <svg width="100" height="24" style={{ display: "block" }}>
        <path
          d="M 5 18 Q 25 6, 50 14 T 95 6"
          fill="none"
          stroke={isProfit ? "var(--bullish)" : "var(--bearish)"}
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className={`dashboard-overview ${animateIn ? "visible" : ""}`}>
      {/* ── Welcome Banner ─────────────────────── */}
      <section className="dash-welcome">
        <div>
          <h1 className="dash-welcome-title">
            {t("ov_welcome")}, <span className="gradient-text">{user?.full_name || "User"}</span> 👋
          </h1>
          <p className="dash-welcome-sub">{t("ov_sub")}</p>
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
          {
            label: "Portfolio snapshot",
            value: portfolioAnalytics ? formatPrice(portfolioAnalytics.total_value) : "₹0.00",
            change: portfolioAnalytics
              ? `${portfolioAnalytics.total_pnl_percent >= 0 ? "+" : ""}${portfolioAnalytics.total_pnl_percent.toFixed(2)}%`
              : "0.00%",
            positive: portfolioAnalytics ? portfolioAnalytics.total_pnl >= 0 : true,
            icon: "💼",
          },
          {
            label: "AI Predictions",
            value: featuredPrediction ? "Active Models" : "No Predictions",
            change: "Daily predictions auto-updated",
            positive: true,
            icon: "🤖",
          },
          {
            label: "Market Mood",
            value: heatmapStocks.length > 0 ? "Bullish Index" : "Awaiting Quotes",
            change: indices[0]
              ? `${indices[0].symbol.replace(".NS", "")} ${indices[0].change_percent >= 0 ? "+" : ""}${indices[0].change_percent.toFixed(2)}%`
              : "Indices Live",
            positive: indices[0] ? indices[0].change_percent >= 0 : true,
            icon: "📈",
          },
          {
            label: "Risk profile",
            value: portfolioAnalytics?.risk_metrics?.volatility_label
              ? `${portfolioAnalytics.risk_metrics.volatility_label} Risk`
              : "Low Risk",
            change: portfolioAnalytics ? `${portfolioAnalytics.risk_metrics.total_holdings} active positions` : "No assets",
            positive: true,
            icon: "⚡",
          },
        ].map((stat, i) => (
          <div key={stat.label} className="dash-stat-card" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="dash-stat-header">
              <span className="dash-stat-label">{stat.label}</span>
              <span className="dash-stat-icon">{stat.icon}</span>
            </div>
            <div className="dash-stat-value">{stat.value}</div>
            <span
              className="dash-stat-change"
              style={{ color: stat.positive ? "var(--bullish)" : "var(--bearish)" }}
            >
              {stat.change}
            </span>
          </div>
        ))}
      </section>

      {/* ── Phase 6 Dashboard Grid (Heatmap & Portfolio Snapshot) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Market Heatmap Widget */}
        <section className="dash-panel" style={{ padding: 20 }}>
          <div className="dash-section-header" style={{ marginBottom: 12 }}>
            <h2 className="dash-section-title">🗺️ Market Heatmap</h2>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Color intensity by day change %</span>
          </div>
          {heatmapStocks.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Loading heatmap assets...
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                minHeight: 160,
              }}
            >
              {heatmapStocks.slice(0, 8).map((stock) => {
                const colors = getHeatmapColor(stock.change_percent);
                return (
                  <Link
                    key={stock.symbol}
                    href={`/dashboard/stock/${stock.symbol.replace(".NS", "")}`}
                    style={{
                      ...colors,
                      borderRadius: 8,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform var(--transition-fast)",
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                    className="heatmap-item"
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{stock.symbol.replace(".NS", "")}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{formatPrice(stock.current_price)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginTop: 2 }}>
                        {stock.change_percent >= 0 ? "+" : ""}
                        {stock.change_percent.toFixed(2)}%
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Portfolio Snapshot Widget */}
        <section className="dash-panel" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="dash-section-header" style={{ marginBottom: 12 }}>
            <h2 className="dash-section-title">💼 Portfolio Valuation</h2>
            <Link href="/dashboard/portfolio" className="dash-section-link">
              Go to Portfolio →
            </Link>
          </div>

          {portfolioAnalytics ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                    {formatPrice(portfolioAnalytics.total_value)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: portfolioAnalytics.total_pnl >= 0 ? "var(--bullish)" : "var(--bearish)",
                      marginTop: 4,
                    }}
                  >
                    {portfolioAnalytics.total_pnl >= 0 ? "+" : ""}
                    {formatPrice(portfolioAnalytics.total_pnl)} ({portfolioAnalytics.total_pnl_percent >= 0 ? "+" : ""}
                    {portfolioAnalytics.total_pnl_percent.toFixed(2)}%)
                  </div>
                </div>
                {renderPortfolioMiniSparkline()}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  background: "var(--surface)",
                  borderRadius: 8,
                  padding: 10,
                  border: "1px solid var(--border)",
                  fontSize: 12.5,
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Invested</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(portfolioAnalytics.total_invested)}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Risk Label</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        portfolioAnalytics.risk_metrics.volatility_label === "High"
                          ? "var(--bearish)"
                          : "var(--bullish)",
                    }}
                  >
                    {portfolioAnalytics.risk_metrics.volatility_label}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No portfolio holdings added yet. Create a portfolio transaction to view stats feedback.
            </div>
          )}
        </section>
      </div>

      {/* ── Featured prediction & Quick scan trade ideas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, marginBottom: 20 }}>
        {/* AI Insight of the Day */}
        <section className="dash-panel" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%", background: "var(--secondary)", opacity: 0.1, filter: "blur(20px)" }} />
          <h2 className="dash-section-title" style={{ marginBottom: 12 }}>🧠 AI Insight of the Day</h2>

          {featuredPrediction ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link
                  href={`/dashboard/stock/${featuredPrediction.symbol.replace(".NS", "")}`}
                  style={{ fontWeight: 800, fontSize: 15, color: "var(--primary-light)", textDecoration: "none" }}
                >
                  {featuredPrediction.symbol.replace(".NS", "")}
                </Link>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: featuredPrediction.outlook === "Bullish" ? "var(--bullish-bg)" : "var(--bearish-bg)",
                    color: featuredPrediction.outlook === "Bullish" ? "var(--bullish)" : "var(--bearish)",
                  }}
                >
                  {featuredPrediction.outlook} ({featuredPrediction.confidence}% Conf)
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                {featuredPrediction.reasons[0] || "Bullish indicator alignment with strong volume."}
              </p>
              <div style={{ fontSize: 12, borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>Target forecast: </span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{featuredPrediction.target}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              No nightly AI prediction analyses generated yet.
            </div>
          )}
        </section>

        {/* Quick Trade Ideas */}
        <section className="dash-panel" style={{ padding: 20 }}>
          <div className="dash-section-header" style={{ marginBottom: 14 }}>
            <h2 className="dash-section-title">⚡ Trade Ideas from Technical Scanner</h2>
            <Link href="/dashboard/markets" className="dash-section-link">
              Markets Scanner →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tradeIdeas.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                No scan triggers detected in last market check.
              </div>
            ) : (
              tradeIdeas.map((idea) => (
                <div
                  key={idea.symbol}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <Link
                      href={`/dashboard/stock/${idea.symbol.replace(".NS", "")}`}
                      style={{ fontWeight: 700, fontSize: 13.5, color: "var(--primary-light)", textDecoration: "none" }}
                    >
                      {idea.symbol.replace(".NS", "")}
                    </Link>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 10 }}>
                      LTP: {formatPrice(idea.price)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {idea.signals.slice(0, 2).map((sig: any, sIdx: number) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: sig.type === "bullish" ? "var(--bullish-bg)" : "var(--bearish-bg)",
                          color: sig.type === "bullish" ? "var(--bullish)" : "var(--bearish)",
                        }}
                      >
                        {sig.pattern}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Market Indices ─────────────────────── */}
      <section className="dash-indices" style={{ marginBottom: 20 }}>
        <div className="dash-section-header">
          <h2 className="dash-section-title">📊 {t("ov_indices")}</h2>
          <Link href="/dashboard/markets" className="dash-section-link">
            View All →
          </Link>
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
                <div className="dash-index-price">{formatPrice(idx.current_price)}</div>
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

      {/* ── Main Grid: Watchlist & Sectors ── */}
      <div className="dash-main-grid" style={{ marginBottom: 20 }}>
        {/* ── Watchlist Panel ────────────────── */}
        <section className="dash-panel dash-watchlist-panel">
          <div className="dash-section-header">
            <h2 className="dash-section-title">⭐ {t("nav_watchlist")}</h2>
            <Link href="/dashboard/watchlist" className="dash-section-link">
              Manage →
            </Link>
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
                    <Link
                      href={`/dashboard/stock/${item.symbol.replace(".NS", "")}`}
                      className="dash-watchlist-symbol"
                      style={{ color: "var(--primary-light)", textDecoration: "none" }}
                    >
                      {item.symbol.replace(".NS", "")}
                    </Link>
                    <div className="dash-watchlist-name">{item.name}</div>
                  </div>
                  <div className="dash-watchlist-right">
                    <div className="dash-watchlist-price">{formatPrice(item.current_price)}</div>
                    <div
                      className="dash-watchlist-change"
                      style={{ color: item.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                    >
                      {item.change_percent >= 0 ? "+" : ""}
                      {item.change_percent?.toFixed(2)}%
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
            <Link href="/dashboard/markets" className="dash-section-link">
              Details →
            </Link>
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
                        background:
                          sector.change_percent >= 0
                            ? "linear-gradient(90deg, rgba(0,230,118,0.3), var(--bullish))"
                            : "linear-gradient(90deg, rgba(255,82,82,0.3), var(--bearish))",
                      }}
                    />
                  </div>
                  <span
                    className="dash-sector-change"
                    style={{ color: sector.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                  >
                    {sector.change_percent >= 0 ? "+" : ""}
                    {sector.change_percent?.toFixed(2)}%
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
            <h2 className="dash-section-title">🚀 {t("ov_gainers")}</h2>
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
                    <Link
                      href={`/dashboard/stock/${stock.symbol.replace(".NS", "")}`}
                      className="dash-mover-symbol"
                      style={{ color: "var(--primary-light)", textDecoration: "none" }}
                    >
                      {stock.symbol.replace(".NS", "")}
                    </Link>
                    <span className="dash-mover-name">{stock.name}</span>
                  </div>
                  <div className="dash-mover-right">
                    <span className="dash-mover-price">{formatPrice(stock.current_price)}</span>
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
            <h2 className="dash-section-title">📉 {t("ov_losers")}</h2>
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
                    <Link
                      href={`/dashboard/stock/${stock.symbol.replace(".NS", "")}`}
                      className="dash-mover-symbol"
                      style={{ color: "var(--primary-light)", textDecoration: "none" }}
                    >
                      {stock.symbol.replace(".NS", "")}
                    </Link>
                    <span className="dash-mover-name">{stock.name}</span>
                  </div>
                  <div className="dash-mover-right">
                    <span className="dash-mover-price">{formatPrice(stock.current_price)}</span>
                    <span className="dash-mover-change" style={{ color: "var(--bearish)" }}>
                      {stock.change_percent?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Quick Actions ──────────────────────── */}
      <section className="dash-quick-actions" style={{ marginTop: 20 }}>
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
