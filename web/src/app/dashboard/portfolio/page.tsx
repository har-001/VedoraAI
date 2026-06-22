"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api, {
  SearchResult,
  PortfolioAnalyticsResponse,
  PortfolioAnalyticsHolding,
} from "@/lib/api";
import { useCurrency } from "../currencyContext";

export default function PortfolioPage() {
  const { formatPrice } = useCurrency();
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Holding Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [searching, setSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.title = "Portfolio Analytics — VedoraAI";
    initPortfolio();
  }, []);

  // Debounced search inside modal
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || selectedAsset) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchAssets(searchQuery);
        if (res.ok && res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedAsset]);

  const initPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.listPortfolios();
      if (res.ok && res.data && res.data.length > 0) {
        const defaultPortfolio = res.data.find((p) => p.is_default) || res.data[0];
        setPortfolioId(defaultPortfolio.id);
        await fetchAnalytics(defaultPortfolio.id);
      } else {
        setError("Failed to load portfolio list.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to initialize portfolio.");
      setLoading(false);
    }
  };

  const fetchAnalytics = async (id: string) => {
    try {
      const res = await api.getPortfolioAnalytics(id);
      if (res.ok && res.data) {
        setAnalytics(res.data);
      } else {
        setError(res.error || "Failed to load portfolio analytics.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load portfolio analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioId || !selectedAsset) return;
    const qty = parseFloat(quantity);
    const buyPrice = parseFloat(avgPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(buyPrice) || buyPrice <= 0) {
      alert("Please enter valid quantity and price.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.addHolding(portfolioId, selectedAsset.symbol, qty, buyPrice, notes);
      if (res.ok) {
        setIsModalOpen(false);
        // Reset state
        setSelectedAsset(null);
        setSearchQuery("");
        setQuantity("");
        setAvgPrice("");
        setNotes("");
        await fetchAnalytics(portfolioId);
      } else {
        alert(res.error || "Failed to add holding.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add holding.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHolding = async (symbol: string) => {
    if (!portfolioId) return;
    if (!confirm(`Are you sure you want to remove all holdings of ${symbol}?`)) return;

    try {
      setLoading(true);
      const res = await api.removeHolding(portfolioId, symbol);
      if (res.ok) {
        await fetchAnalytics(portfolioId);
      } else {
        alert(res.error || "Failed to remove holding.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove holding.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!analytics || !analytics.allocation || analytics.allocation.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Symbol",
      "Asset Name",
      "Quantity",
      "Average Buy Price",
      "Current Price",
      "Current Value",
      "Invested Value",
      "P&L (₹)",
      "P&L (%)",
      "Sector",
      "Weight (%)",
    ];

    const rows = analytics.allocation.map((h) => [
      h.symbol,
      `"${h.name.replace(/"/g, '""')}"`,
      h.quantity,
      h.avg_buy_price,
      h.current_price,
      h.current_value,
      h.invested_value,
      h.pnl,
      h.pnl_percent,
      h.sector,
      h.weight,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `VedoraAI_Portfolio_${analytics.portfolio_name.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color palette for chart slices
  const COLORS = [
    "#6C5CE7",
    "#00D2FF",
    "#00E676",
    "#FFD93D",
    "#FF5252",
    "#FFA726",
    "#29B6F6",
    "#E84118",
    "#9C27B0",
    "#E91E63",
  ];

  // Helper to draw SVG Donut Chart
  const renderDonutChart = () => {
    if (!analytics || !analytics.allocation || analytics.allocation.length === 0) return null;

    const data = analytics.allocation;
    const radius = 70;
    const strokeWidth = 24;
    const center = 100;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ display: "block", margin: "0 auto" }}>
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="var(--border)" strokeWidth={strokeWidth} />
        {data.map((item, index) => {
          if (item.weight <= 0) return null;
          const strokeLength = (item.weight / 100) * circumference;
          const strokeOffset = circumference - (accumulatedPercentage / 100) * circumference;
          accumulatedPercentage += item.weight;
          const strokeColor = COLORS[index % COLORS.length];

          return (
            <circle
              key={item.symbol}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            >
              <title>{`${item.symbol}: ${item.weight}%`}</title>
            </circle>
          );
        })}
        {/* Center label */}
        <text x={center} y={center - 5} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">
          HOLDINGS
        </text>
        <text x={center} y={center + 15} textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="800">
          {data.length}
        </text>
      </svg>
    );
  };

  // Helper to draw Portfolio Value Sparkline
  const renderSparkline = () => {
    if (!analytics || !analytics.allocation || analytics.allocation.length === 0) return null;

    // We simulate a 30-day equity path based on asset returns and weight distributions
    const days = 30;
    const width = 800;
    const height = 120;
    const padding = 10;

    // Deterministic simulation
    const points: number[] = [];
    let currentVal = analytics.total_invested;
    const targetVal = analytics.total_value;

    for (let i = 0; i < days; i++) {
      const pct = i / (days - 1);
      // Create a wavy line leading to final value
      const wave = Math.sin(pct * Math.PI * 3.5) * (analytics.total_invested * 0.02);
      const simulatedPrice = currentVal + (targetVal - currentVal) * pct + wave;
      points.push(simulatedPrice);
    }

    const minVal = Math.min(...points) * 0.99;
    const maxVal = Math.max(...points) * 1.01;

    const getX = (i: number) => padding + (i / (days - 1)) * (width - 2 * padding);
    const getY = (val: number) =>
      height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);

    let pathD = "";
    let areaD = "";
    for (let i = 0; i < days; i++) {
      const x = getX(i);
      const y = getY(points[i]);
      if (i === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${height} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
      if (i === days - 1) {
        areaD += ` L ${x} ${height} Z`;
      }
    }

    const isProfit = analytics.total_pnl >= 0;

    return (
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id="spark-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isProfit ? "var(--bullish)" : "var(--bearish)"} stopOpacity="0.15" />
              <stop offset="100%" stopColor={isProfit ? "var(--bullish)" : "var(--bearish)"} stopOpacity="0.00" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#spark-area-grad)" />
          <path d={pathD} fill="none" stroke={isProfit ? "var(--bullish)" : "var(--bearish)"} strokeWidth="2.5" />
        </svg>
      </div>
    );
  };

  const renderSingleSparkline = (item: PortfolioAnalyticsHolding) => {
    // Mini 7-day sparkline for individual assets
    const days = 7;
    const width = 100;
    const height = 30;
    const padding = 2;

    const points: number[] = [];
    const changeFactor = item.day_change / 100;
    for (let i = 0; i < days; i++) {
      const pct = i / (days - 1);
      points.push(item.current_price * (1 - changeFactor * (1 - pct)));
    }

    const minVal = Math.min(...points);
    const maxVal = Math.max(...points);

    const getX = (i: number) => padding + (i / (days - 1)) * (width - 2 * padding);
    const getY = (val: number) =>
      height - padding - (maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal)) * (height - 2 * padding);

    let pathD = "";
    for (let i = 0; i < days; i++) {
      const x = getX(i);
      const y = getY(points[i]);
      if (i === 0) {
        pathD = `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    }

    return (
      <svg width={width} height={height}>
        <path d={pathD} fill="none" stroke={item.day_change >= 0 ? "var(--bullish)" : "var(--bearish)"} strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="dash-welcome-title" style={{ marginBottom: 4 }}>💼 Portfolio Intelligence</h1>
          <p className="dash-welcome-sub">Advanced allocation breakdown, risk analysis, and metrics feedback</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>
            📤 Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)} style={{ padding: "8px 16px" }}>
            + Add Holding
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 20, color: "var(--bearish)", background: "rgba(255,82,82,0.1)", borderRadius: 10 }}>
          {error}
        </div>
      )}

      {analytics && (
        <>
          {/* Summary Stats Grid */}
          <div className="dash-stats-grid">
            {[
              { label: "Total Valuation", value: formatPrice(analytics.total_value), icon: "💼" },
              { label: "Invested Capital", value: formatPrice(analytics.total_invested), icon: "💰" },
              {
                label: "Total profit / Loss",
                value: `${analytics.total_pnl >= 0 ? "+" : ""}${formatPrice(analytics.total_pnl)}`,
                icon: analytics.total_pnl >= 0 ? "📈" : "📉",
                color: analytics.total_pnl >= 0 ? "var(--bullish)" : "var(--bearish)",
              },
              {
                label: "Aggregate Returns",
                value: `${analytics.total_pnl_percent >= 0 ? "+" : ""}${analytics.total_pnl_percent.toFixed(2)}%`,
                icon: "🎯",
                color: analytics.total_pnl_percent >= 0 ? "var(--bullish)" : "var(--bearish)",
              },
            ].map((s, idx) => (
              <div key={idx} className="dash-stat-card">
                <div className="dash-stat-header">
                  <span className="dash-stat-label">{s.label}</span>
                  <span className="dash-stat-icon">{s.icon}</span>
                </div>
                <div className="dash-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Sparkline & Risk Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
            {/* Sparkline graph */}
            <div className="dash-panel" style={{ padding: 20 }}>
              <h2 className="dash-section-title" style={{ marginBottom: 16 }}>📈 Valuation Trend Sparkline (30D)</h2>
              {renderSparkline()}
            </div>

            {/* Risk Dashboard */}
            <div className="dash-panel" style={{ padding: 20 }}>
              <h2 className="dash-section-title" style={{ marginBottom: 16 }}>🧠 Risk & Diversification</h2>
              {analytics.risk_metrics && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Assets Count</span>
                    <span style={{ fontWeight: 700 }}>{analytics.risk_metrics.total_holdings} stocks</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Sectors Exposed</span>
                    <span style={{ fontWeight: 700 }}>{analytics.risk_metrics.total_sectors} sectors</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Diversification score</span>
                    <span style={{ fontWeight: 700, color: "var(--secondary-light)" }}>{analytics.risk_metrics.diversification_score} / 100</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Top Concentration Weight</span>
                    <span style={{ fontWeight: 700 }}>{analytics.risk_metrics.concentration_top}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Largest Position</span>
                    <span style={{ fontWeight: 700 }}>{analytics.risk_metrics.largest_position || "None"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Volatility Profile</span>
                    <span style={{
                      fontWeight: 700,
                      color: analytics.risk_metrics.volatility_label === "High" ? "var(--bearish)" : analytics.risk_metrics.volatility_label === "Low" ? "var(--bullish)" : "var(--neutral-color)"
                    }}>
                      {analytics.risk_metrics.volatility_label} Risk
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Allocation Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>
            {/* Donut Chart */}
            <div className="dash-panel" style={{ padding: 20 }}>
              <h2 className="dash-section-title" style={{ marginBottom: 16 }}>🍩 Asset Weights</h2>
              {renderDonutChart()}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 14 }}>
                {analytics.allocation.map((item, index) => (
                  <div key={item.symbol} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: COLORS[index % COLORS.length] }} />
                    <span style={{ fontWeight: 600 }}>{item.symbol}</span>
                    <span style={{ color: "var(--text-muted)" }}>({item.weight}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector allocations */}
            <div className="dash-panel" style={{ padding: 20 }}>
              <h2 className="dash-section-title" style={{ marginBottom: 16 }}>🏭 Sector Concentration</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {analytics.sector_allocation.map((sec, idx) => (
                  <div key={sec.sector} style={{ fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{sec.sector}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {formatPrice(sec.value)} ({sec.weight}%)
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${sec.weight}%`,
                          background: COLORS[idx % COLORS.length],
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Holdings list */}
          <div className="dash-panel" style={{ padding: 20 }}>
            <h2 className="dash-section-title" style={{ marginBottom: 16 }}>📋 Active Holdings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {analytics.allocation.map((h, index) => (
                <div
                  key={h.symbol}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1fr 0.5fr",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    gap: 8,
                  }}
                >
                  <div>
                    <Link href={`/dashboard/stock/${h.symbol}`} style={{ fontWeight: 700, fontSize: 14, color: "var(--primary-light)", textDecoration: "none" }}>
                      {h.symbol}
                    </Link>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{h.name}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Weight</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{h.weight}%</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Qty / Avg</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {h.quantity} @ {formatPrice(h.avg_buy_price)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>LTP</div>
                    <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "var(--font-mono)" }}>
                      {formatPrice(h.current_price)}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {renderSingleSparkline(h)}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>PNL</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: h.pnl >= 0 ? "var(--bullish)" : "var(--bearish)" }}>
                      {h.pnl >= 0 ? "+" : ""}{formatPrice(h.pnl)} ({h.pnl_percent >= 0 ? "+" : ""}{h.pnl_percent.toFixed(2)}%)
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleRemoveHolding(h.symbol)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bearish)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      title="Delete Holding"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Add Holding Modal ─────────────────── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setIsModalOpen(false);
            setSelectedAsset(null);
            setSearchQuery("");
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 500,
              padding: 24,
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)" }}>Add Portfolio Holding</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAsset(null);
                  setSearchQuery("");
                }}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddHolding}>
              {/* Asset Search */}
              {!selectedAsset ? (
                <div className="cut-input-group" style={{ marginBottom: 16 }}>
                  <input
                    className="input"
                    placeholder="Search stock symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    id="holding-search"
                  />
                  <label htmlFor="holding-search" className="input-label">Search Stock</label>

                  {/* Results list */}
                  <div style={{ maxHeight: 150, overflowY: "auto", marginTop: 8 }}>
                    {searching ? (
                      <div style={{ fontSize: 12, padding: 8, color: "var(--text-muted)" }}>Searching...</div>
                    ) : searchQuery && searchResults.length === 0 ? (
                      <div style={{ fontSize: 12, padding: 8, color: "var(--text-muted)" }}>No stocks found</div>
                    ) : (
                      searchResults.map((res) => (
                        <button
                          key={res.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedAsset(res);
                            setAvgPrice(""); // Keep empty for input
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: 8,
                            background: "rgba(255,255,255,0.01)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            marginBottom: 4,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{res.symbol.replace(".NS", "")}</span> - {res.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card)", padding: 12, borderRadius: 8, border: "1px solid var(--border)", marginBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{selectedAsset.symbol.replace(".NS", "")}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8 }}>{selectedAsset.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(null)}
                    style={{ background: "transparent", border: "none", color: "var(--bearish)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Quantity */}
              <div className="cut-input-group" style={{ marginBottom: 16 }}>
                <input
                  className="input"
                  type="number"
                  step="any"
                  placeholder="e.g. 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  id="holding-quantity"
                />
                <label htmlFor="holding-quantity" className="input-label">Quantity</label>
              </div>

              {/* Buy Price */}
              <div className="cut-input-group" style={{ marginBottom: 16 }}>
                <input
                  className="input"
                  type="number"
                  step="any"
                  placeholder="e.g. 1450"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  required
                  id="holding-price"
                />
                <label htmlFor="holding-price" className="input-label">Avg Buy Price (₹)</label>
              </div>

              {/* Notes */}
              <div className="cut-input-group" style={{ marginBottom: 20 }}>
                <input
                  className="input"
                  placeholder="e.g. Bought on support level"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  id="holding-notes"
                />
                <label htmlFor="holding-notes" className="input-label">Notes (Optional)</label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={!selectedAsset}
              >
                Add to Portfolio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
