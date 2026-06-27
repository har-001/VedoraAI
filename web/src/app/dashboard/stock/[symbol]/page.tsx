"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, {
  StockDetailResponse,
  PredictionData,
  NewsArticle,
  WatchlistResponse,
  ChartCandle,
} from "@/lib/api";
import { useCurrency } from "../../currencyContext";

export type Timeframe = "1m" | "2m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | "1mo";

export interface TimeframeConfig {
  key: Timeframe;
  label: string;
  interval: string;
  range: string;
}

export const TIMEFRAMES: TimeframeConfig[] = [
  { key: "1m", label: "1 Min", interval: "1m", range: "1d" },
  { key: "2m", label: "2 Min", interval: "2m", range: "1d" },
  { key: "5m", label: "5 Min", interval: "5m", range: "1d" },
  { key: "15m", label: "15 Min", interval: "15m", range: "1d" },
  { key: "30m", label: "30 Min", interval: "30m", range: "1d" },
  { key: "1h", label: "1 Hr", interval: "1h", range: "5d" },
  { key: "4h", label: "4 Hr", interval: "1h", range: "1mo" },
  { key: "1d", label: "1 Day", interval: "1d", range: "3mo" },
  { key: "1w", label: "1 Wk", interval: "1wk", range: "1y" },
  { key: "1mo", label: "1 Mo", interval: "1mo", range: "5y" }
];

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const symbol = (params?.symbol as string) || "";

  // Data State
  const [stockDetail, setStockDetail] = useState<StockDetailResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistResponse[]>([]);
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [candles, setCandles] = useState<ChartCandle[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [watchlistMenuOpen, setWatchlistMenuOpen] = useState(false);

  // Modal State for adding transaction to portfolio
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [tradeQuantity, setTradeQuantity] = useState("10");
  const [tradePrice, setTradePrice] = useState("");
  const [tradeNotes, setTradeNotes] = useState("");
  const [tradeSubmitting, setTradeSubmitting] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const fetchChartData = async () => {
    if (!symbol) return;
    try {
      setLoadingChart(true);
      const activeTf = TIMEFRAMES.find((t) => t.key === timeframe) || TIMEFRAMES.find((t) => t.key === "1d")!;
      const res = await api.getStockChart(symbol, activeTf.interval, activeTf.range);
      if (res.ok && res.data) {
        setCandles(res.data.candles || []);
      }
    } catch (err) {
      console.error("Error loading chart:", err);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      document.title = `${symbol.toUpperCase()} Detail — VedoraAI`;
      fetchData();
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol && timeframe) {
      fetchChartData();
    }
  }, [symbol, timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [detailRes, predRes, newsRes, wlRes, portRes] = await Promise.all([
        api.getStockDetail(symbol),
        api.getPrediction(symbol).catch(() => ({ ok: false, data: null })), // Prediction might not exist or error
        api.getSymbolNews(symbol).catch(() => ({ ok: false, data: null })),
        api.listWatchlists().catch(() => ({ ok: false, data: null })),
        api.listPortfolios().catch(() => ({ ok: false, data: null })),
      ]);

      if (detailRes.ok && detailRes.data) {
        setStockDetail(detailRes.data);
        if (detailRes.data.current_price) {
          setTradePrice(detailRes.data.current_price.toString());
        }
      } else {
        setError(detailRes.error || "Failed to fetch stock details.");
      }

      if (predRes.ok && predRes.data) {
        setPrediction(predRes.data.prediction);
      }

      if (newsRes.ok && newsRes.data) {
        setNews(newsRes.data.articles || []);
      }

      if (wlRes.ok && wlRes.data) {
        setWatchlists(wlRes.data);
        // Check if stock is in default watchlist
        const defaultWl = wlRes.data.find((w) => w.is_default) || wlRes.data[0];
        if (defaultWl) {
          const exists = defaultWl.items?.some(
            (item) => item.symbol.toUpperCase() === symbol.toUpperCase()
          );
          setInWatchlist(!!exists);
        }
      }

      if (portRes.ok && portRes.data) {
        setPortfolios(portRes.data);
        if (portRes.data.length > 0) {
          const defPort = portRes.data.find((p: any) => p.is_default) || portRes.data[0];
          setSelectedPortfolioId(defPort.id);
        }
      }
    } catch (err) {
      console.error("Error loading stock detail page", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (watchlists.length === 0) return;
    const defaultWl = watchlists.find((w) => w.is_default) || watchlists[0];
    try {
      if (inWatchlist) {
        const res = await api.removeWatchlistItem(defaultWl.id, symbol);
        if (res.ok) {
          setInWatchlist(false);
        }
      } else {
        const res = await api.addWatchlistItem(defaultWl.id, symbol);
        if (res.ok) {
          setInWatchlist(true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
    }
  };

  const handleAddHoldingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioId || !tradeQuantity || !tradePrice) return;
    try {
      setTradeSubmitting(true);
      const res = await api.addHolding(
        selectedPortfolioId,
        symbol.toUpperCase(),
        Number(tradeQuantity),
        Number(tradePrice),
        tradeNotes || undefined
      );
      if (res.ok) {
        setPortfolioModalOpen(false);
        setTradeNotes("");
        alert(`Successfully added ${tradeQuantity} shares of ${symbol.toUpperCase()} to your portfolio.`);
      } else {
        alert(res.error || "Failed to add holding.");
      }
    } catch (err) {
      alert("Error adding portfolio holding.");
    } finally {
      setTradeSubmitting(false);
    }
  };

  const renderSVGChart = () => {
    if (!stockDetail) return null;
    if (loadingChart) {
      return (
        <div style={{ height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 12 }}>
          <svg className="animate-spin h-8 w-8 text-primary" style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Fetching live chart data...</span>
        </div>
      );
    }
    if (candles.length === 0) {
      return (
        <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          No chart data available for this timeframe.
        </div>
      );
    }

    const width = 800;
    const height = 300;
    const padding = 45;
    const bottomPadding = 30;

    const closes = candles.map((c) => c.close);
    const minPrice = Math.min(...closes) * 0.99;
    const maxPrice = Math.max(...closes) * 1.01;

    const n = candles.length;
    const getX = (i: number) => padding + (i / (n - 1)) * (width - 2 * padding);
    const getY = (val: number) =>
      height - bottomPadding - ((val - minPrice) / (maxPrice - minPrice)) * (height - padding - bottomPadding);

    // Build SVG Path
    let linePath = "";
    let areaPath = "";

    for (let i = 0; i < n; i++) {
      const x = getX(i);
      const y = getY(candles[i].close);

      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${height - bottomPadding} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }

      if (i === n - 1) {
        areaPath += ` L ${x} ${height - bottomPadding} Z`;
      }
    }

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      if (!chartContainerRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const chartWidth = rect.width;

      const pct = (clickX - (padding / width) * chartWidth) / (((width - 2 * padding) / width) * chartWidth);
      const idx = Math.max(0, Math.min(n - 1, Math.round(pct * (n - 1))));
      setHoverIndex(idx);
    };

    const activePoint = hoverIndex !== null && hoverIndex < n ? candles[hoverIndex] : null;
    const isBullish = stockDetail.change_percent >= 0;

    return (
      <div style={{ position: "relative" }} ref={chartContainerRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isBullish ? "var(--bullish)" : "var(--bearish)"} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isBullish ? "var(--bullish)" : "var(--bearish)"} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={getY(minPrice)} x2={width - padding} y2={getY(minPrice)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1={padding} y1={getY((minPrice + maxPrice) / 2)} x2={width - padding} y2={getY((minPrice + maxPrice) / 2)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1={padding} y1={getY(maxPrice)} x2={width - padding} y2={getY(maxPrice)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />

          {/* Area under curve */}
          <path d={areaPath} fill="url(#chart-area-grad)" />

          {/* Main Price Line */}
          <path d={linePath} fill="none" stroke={isBullish ? "var(--bullish)" : "var(--bearish)"} strokeWidth="2.5" />

          {/* Hover crosshair */}
          {activePoint && hoverIndex !== null && (
            <>
              <line
                x1={getX(hoverIndex)}
                y1={padding}
                x2={getX(hoverIndex)}
                y2={height - bottomPadding}
                stroke="var(--border-light)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activePoint.close)}
                r="5"
                fill={isBullish ? "var(--bullish)" : "var(--bearish)"}
                stroke="var(--card)"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Labels */}
          <text x={padding - 5} y={getY(minPrice) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
            {formatPrice(minPrice)}
          </text>
          <text x={padding - 5} y={getY((minPrice + maxPrice) / 2) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
            {formatPrice((minPrice + maxPrice) / 2)}
          </text>
          <text x={padding - 5} y={getY(maxPrice) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
            {formatPrice(maxPrice)}
          </text>

          {/* Date boundaries */}
          <text x={padding} y={height - 10} fill="var(--text-muted)" fontSize="10" textAnchor="start">
            {candles[0] ? new Date(candles[0].time * 1000).toLocaleDateString() : ""}
          </text>
          <text x={width - padding} y={height - 10} fill="var(--text-muted)" fontSize="10" textAnchor="end">
            {candles[n - 1] ? new Date(candles[n - 1].time * 1000).toLocaleDateString() : ""}
          </text>
        </svg>

        {/* Float details panel on hover */}
        {activePoint && hoverIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 15,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "6px 12px",
              fontSize: 12,
              zIndex: 10,
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              {new Date(activePoint.time * 1000).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Close: </span>
                <span style={{ fontWeight: 700 }}>{formatPrice(activePoint.close)}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Volume: </span>
                <span style={{ fontWeight: 700 }}>{activePoint.volume.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 0" }}>
        <div style={{ height: 40, width: 200, background: "var(--border)", borderRadius: 6, animation: "pulse-glow 1.5s infinite" }} />
        <div style={{ height: 100, width: "100%", background: "var(--border)", borderRadius: 12, animation: "pulse-glow 1.5s infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ height: 350, background: "var(--border)", borderRadius: 12, animation: "pulse-glow 1.5s infinite" }} />
          <div style={{ height: 350, background: "var(--border)", borderRadius: 12, animation: "pulse-glow 1.5s infinite" }} />
        </div>
      </div>
    );
  }

  if (error || !stockDetail) {
    return (
      <div className="dash-panel" style={{ textAlign: "center", padding: "60px 40px", color: "var(--bearish)" }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>⚠️</span>
        <h3 style={{ fontSize: 20, marginBottom: 8, color: "var(--text-primary)" }}>Stock Detail Error</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>{error || "We could not find data for this asset symbol."}</p>
        <Link href="/dashboard/markets" className="btn btn-secondary">
          Return to Markets
        </Link>
      </div>
    );
  }

  const changeSign = stockDetail.change >= 0 ? "+" : "";
  const isPositive = stockDetail.change >= 0;

  // Render 52-week position indicator slider
  const weekRangePct = stockDetail.stats
    ? ((stockDetail.current_price - stockDetail.stats.week52_low) /
        (stockDetail.stats.week52_high - stockDetail.stats.week52_low)) *
      100
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Breadcrumb navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <Link href="/dashboard/markets" style={{ color: "var(--text-muted)" }}>
            Markets
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{stockDetail.symbol}</span>
        </div>
        <Link href="/dashboard/markets" className="btn btn-xs btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>
          ← Back to List
        </Link>
      </div>

      {/* Main Stock Header Card */}
      <div className="dash-panel" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-heading)" }}>
              {stockDetail.name}
            </h1>
            <span
              style={{
                background: "var(--border)",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-secondary)",
              }}
            >
              {stockDetail.symbol}
            </span>
            <span
              style={{
                background: stockDetail.market_state.includes("CLOSED") ? "var(--bearish-bg)" : "var(--bullish-bg)",
                color: stockDetail.market_state.includes("CLOSED") ? "var(--bearish)" : "var(--bullish)",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {stockDetail.market_state}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
            <span>Exchange: {stockDetail.exchange}</span>
            <span>•</span>
            <span>Currency: {stockDetail.currency}</span>
          </div>
        </div>

        {/* Current Price Block */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-heading)" }}>
              {formatPrice(stockDetail.current_price)}
            </div>
            <div style={{ color: isPositive ? "var(--bullish)" : "var(--bearish)", fontWeight: 700, fontSize: 14 }}>
              {changeSign}
              {formatPrice(stockDetail.change)} ({changeSign}
              {stockDetail.change_percent.toFixed(2)}%)
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div style={{ display: "flex", gap: 8, position: "relative" }}>
            <button
              onClick={handleToggleWatchlist}
              className={`btn ${inWatchlist ? "btn-secondary" : "btn-primary"}`}
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              {inWatchlist ? "⭐ Watchlisted" : "☆ Add Watchlist"}
            </button>
            <button
              onClick={() => setPortfolioModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              💼 Buy / Portfolio
            </button>
            <Link
              href={`/dashboard/backtest?symbol=${stockDetail.symbol}`}
              className="btn btn-secondary"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              🧪 Backtest
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Interactive Chart & Stats, Right is AI predicions & News */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>
        {/* Left Side Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* SVG Chart Panel */}
          <div className="dash-panel" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📊 Interactive Chart</h2>
              <div style={{ display: "flex", gap: 4, background: "var(--surface)", padding: 3, borderRadius: 8, border: "1px solid var(--border)", overflowX: "auto", maxWidth: "100%" }}>
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.key}
                    onClick={() => setTimeframe(tf.key)}
                    style={{
                      border: "none",
                      outline: "none",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      background: timeframe === tf.key ? "var(--border)" : "transparent",
                      color: timeframe === tf.key ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {renderSVGChart()}
          </div>

          {/* Key Fundamentals and Metrics Grid */}
          <div className="dash-panel" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>📋 Key Statistics</h2>
            {stockDetail.stats && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* 52-week high low bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                    <span>52W Low ({formatPrice(stockDetail.stats.week52_low)})</span>
                    <span>52W High ({formatPrice(stockDetail.stats.week52_high)})</span>
                  </div>
                  <div style={{ position: "relative", height: 6, background: "var(--surface)", borderRadius: 3, border: "1px solid var(--border)" }}>
                    <div
                      style={{
                        position: "absolute",
                        top: -1,
                        left: `${Math.max(0, Math.min(100, weekRangePct))}%`,
                        width: 8,
                        height: 8,
                        background: "var(--primary-light)",
                        borderRadius: "50%",
                        boxShadow: "0 0 8px var(--primary)",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>Day High</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(stockDetail.day_high)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>Day Low</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(stockDetail.day_low)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>Prev Close</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(stockDetail.previous_close)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>Volume</span>
                    <span style={{ fontWeight: 600 }}>{stockDetail.volume.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>Avg Volume (6M)</span>
                    <span style={{ fontWeight: 600 }}>{stockDetail.stats.avg_volume.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>SMA (50)</span>
                    <span style={{ fontWeight: 600, color: stockDetail.current_price >= stockDetail.stats.sma_50 ? "var(--bullish)" : "var(--bearish)" }}>
                      {formatPrice(stockDetail.stats.sma_50)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>SMA (200)</span>
                    <span style={{ fontWeight: 600, color: stockDetail.current_price >= stockDetail.stats.sma_200 ? "var(--bullish)" : "var(--bearish)" }}>
                      {formatPrice(stockDetail.stats.sma_200)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>Market</span>
                    <span style={{ fontWeight: 600 }}>{stockDetail.exchange} (NSE)</span>
                  </div>
                </div>

                {/* Returns summary table */}
                <div style={{ marginTop: 8 }}>
                  <h3 style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>📈 Performance Return History</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, textAlign: "center" }}>
                    {[
                      { label: "1D", val: stockDetail.performance["1d"] },
                      { label: "1W", val: stockDetail.performance["1w"] },
                      { label: "1M", val: stockDetail.performance["1m"] },
                      { label: "3M", val: stockDetail.performance["3m"] },
                      { label: "6M", val: stockDetail.performance["6m"] },
                    ].map((p, i) => (
                      <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 4px", borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{p.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: p.val >= 0 ? "var(--bullish)" : "var(--bearish)" }}>
                          {p.val >= 0 ? "+" : ""}{p.val}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Intelligence predictions card */}
          <div className="dash-panel" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "var(--primary)", opacity: 0.1, filter: "blur(20px)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px 0" }}>
              🤖 AI Market Outlook
            </h2>

            {prediction ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", padding: 12, borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Vedora Outlook</span>
                    <span style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: prediction.outlook === "Bullish" ? "var(--bullish)" : prediction.outlook === "Bearish" ? "var(--bearish)" : "var(--neutral-color)"
                    }}>
                      {prediction.outlook}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Confidence</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{prediction.confidence}%</span>
                  </div>
                </div>

                <div style={{ fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Price Target ({prediction.horizon})</span>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
                    <span style={{ color: "var(--bearish)" }}>{formatPrice(prediction.target_low)}</span>
                    <span style={{ color: "var(--primary-light)" }}>{prediction.target}</span>
                    <span style={{ color: "var(--bullish)" }}>{formatPrice(prediction.target_high)}</span>
                  </div>
                </div>

                {/* Key indicators list */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 600 }}>Technical Ratings</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>RSI</span>
                      <span style={{ fontWeight: 600 }}>{prediction.indicators.rsi?.toFixed(1) || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>MACD</span>
                      <span style={{ fontWeight: 600 }}>{prediction.indicators.macd?.toFixed(2) || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>ADX (Trend)</span>
                      <span style={{ fontWeight: 600 }}>{prediction.indicators.adx?.toFixed(1) || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Risk Rating</span>
                      <span style={{
                        fontWeight: 700,
                        color: prediction.risk === "Low" ? "var(--bullish)" : prediction.risk === "High" ? "var(--bearish)" : "var(--neutral-color)"
                      }}>
                        {prediction.risk}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 6 }}>Model Analysis Arguments:</span>
                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                    {prediction.reasons.map((r, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>🧠</span>
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                  No active prediction found for this asset. Vedora's AI model runs nightly evaluations on selected high-volatility equities.
                </p>
                <button
                  onClick={() => alert("Prediction calculation triggered. Refresh in 10 seconds.")}
                  className="btn btn-secondary btn-xs"
                  style={{ marginTop: 12, fontSize: 11 }}
                >
                  Force Calculate prediction
                </button>
              </div>
            )}
          </div>

          {/* Symbol related News feed */}
          <div className="dash-panel" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>📰 Symbol Intelligence News</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
              {news.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  No recent publications found for this symbol.
                </div>
              ) : (
                news.map((item, i) => {
                  const sentimentColor =
                    item.sentiment.label === "bullish"
                      ? "var(--bullish)"
                      : item.sentiment.label === "bearish"
                      ? "var(--bearish)"
                      : "var(--neutral-color)";

                  return (
                    <div
                      key={i}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 12,
                        transition: "border-color var(--transition-fast)",
                      }}
                      className="news-item-hover"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>
                          {item.source} • {item.time_ago}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: `${sentimentColor}1a`,
                            color: sentimentColor,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.sentiment.label}
                        </span>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          display: "block",
                          marginTop: 6,
                          lineHeight: 1.4,
                          textDecoration: "none",
                        }}
                      >
                        {item.title}
                      </a>
                      <p style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 6, margin: "6px 0 0 0", lineClamp: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.summary}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buy/Portfolio Dialog Modal */}
      {portfolioModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div className="dash-panel" style={{ width: "100%", maxWidth: 440, padding: 24, position: "relative" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0" }}>
              💼 Add {symbol.toUpperCase()} to Portfolio
            </h3>

            {portfolios.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
                You must create a portfolio first in the Portfolio page before configuring transactions.
              </div>
            ) : (
              <form onSubmit={handleAddHoldingSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="cut-input-group">
                  <select
                    className="input"
                    value={selectedPortfolioId}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                    style={{ background: "transparent", color: "var(--text-primary)" }}
                  >
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id} style={{ background: "var(--surface)" }}>
                        {p.name} {p.is_default ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <label className="input-label">Select Portfolio</label>
                </div>

                <div className="cut-input-group">
                  <input
                    type="number"
                    className="input"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(e.target.value)}
                    required
                    min="1"
                  />
                  <label className="input-label">Quantity</label>
                </div>

                <div className="cut-input-group">
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    required
                  />
                  <label className="input-label">Average Buy Price (₹)</label>
                </div>

                <div className="cut-input-group">
                  <input
                    type="text"
                    className="input"
                    value={tradeNotes}
                    onChange={(e) => setTradeNotes(e.target.value)}
                    placeholder="e.g. Long-term accumulation"
                  />
                  <label className="input-label">Notes (Optional)</label>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setPortfolioModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tradeSubmitting}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px" }}
                  >
                    {tradeSubmitting ? "Adding..." : "Add Transaction"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
