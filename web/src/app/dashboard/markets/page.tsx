"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import api, { MarketQuote, ScanResponse, ScanItem } from "@/lib/api";

const sectors = ["All", "IT", "Banking", "Energy", "FMCG", "Auto", "Pharma", "Metal", "NBFC", "Infra", "Telecom"];

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<"live" | "scanner">("live");
  const [stocks, setStocks] = useState<MarketQuote[]>([]);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"change" | "price" | "volume">("change");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scanner State
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [expandedScanSymbol, setExpandedScanSymbol] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.title = "Markets — VedoraAI";
    fetchPopularStocks();
  }, []);

  useEffect(() => {
    if (activeTab === "scanner") {
      fetchScannerData();
    }
  }, [activeTab]);

  // Handle live search debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!search.trim()) {
      fetchPopularStocks();
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(search.trim());
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const fetchPopularStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPopularStocks();
      if (res.ok && res.data) {
        setStocks(res.data);
      } else {
        setError(res.error || "Failed to fetch popular stocks.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch popular stocks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchScannerData = async (force = false) => {
    if (scanData && !force) return;
    try {
      setScanLoading(true);
      setScanError(null);
      const res = await api.getMarketScan(force);

      if (res.ok && res.data) {
        setScanData(res.data);
      } else {
        setScanError(res.error || "Failed to fetch scan results.");
      }
    } catch (err) {
      console.error(err);
      setScanError("Failed to fetch technical scanner patterns.");
    } finally {
      setScanLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const searchRes = await api.searchAssets(query);
      if (searchRes.ok && searchRes.data && searchRes.data.length > 0) {
        const symbols = searchRes.data.map((item) => item.symbol);
        const quotesRes = await api.getMultipleQuotes(symbols);
        if (quotesRes.ok && quotesRes.data) {
          setStocks(quotesRes.data);
        }
      } else {
        setStocks([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to search assets.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine simulated sectors since yfinance NSE quote structure is dynamic
  const getSector = (symbol: string): string => {
    const sym = symbol.replace(".NS", "").toUpperCase();
    if (["RELIANCE", "ONGC", "NTPC", "BPCL", "IOC"].includes(sym)) return "Energy";
    if (["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"].includes(sym)) return "IT";
    if (["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"].includes(sym)) return "Banking";
    if (["ITC", "HINDUNILVR", "NESTLEIND", "BRITANNIA"].includes(sym)) return "FMCG";
    if (["TATAMOTORS", "MARUTI", "M&M", "BAJAJ-AUTO", "HEROMOTOCO"].includes(sym)) return "Auto";
    if (["SUNPHARMA", "CIPLA", "DRREDDY", "APOLLOHOSP"].includes(sym)) return "Pharma";
    if (["TATASTEEL", "JINDALSTEL", "HINDALCO", "COALINDIA"].includes(sym)) return "Metal";
    if (["BAJFINANCE", "BAJAJFINSV", "CHOLAFIN"].includes(sym)) return "NBFC";
    if (["LT", "ADANIPORTS", "ULTRACEMCO"].includes(sym)) return "Infra";
    if (["BHARTIARTL", "IDEA"].includes(sym)) return "Telecom";
    return "Other";
  };

  const filteredStocks = stocks
    .filter((s) => {
      if (filter === "All") return true;
      return getSector(s.symbol) === filter;
    })
    .sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      if (sortBy === "change") return dir * (a.change_percent - b.change_percent);
      if (sortBy === "price") return dir * (a.current_price - b.current_price);
      if (sortBy === "volume") return dir * (a.volume - b.volume);
      return 0;
    });

  const handleSort = (col: "change" | "price" | "volume") => {
    if (sortBy === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="dash-welcome" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dash-welcome-title">📈 Markets</h1>
          <p className="dash-welcome-sub">Live prices and AI technical pattern scanner for NSE stocks</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: "var(--surface)",
        padding: 4,
        borderRadius: 10,
        maxWidth: 360,
        border: "1px solid var(--border)"
      }}>
        <button
          onClick={() => setActiveTab("live")}
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "live" ? "var(--border-light)" : "transparent",
            color: activeTab === "live" ? "var(--text-primary)" : "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          📈 Live Quotes
        </button>
        <button
          onClick={() => setActiveTab("scanner")}
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "scanner" ? "var(--border-light)" : "transparent",
            color: activeTab === "scanner" ? "var(--text-primary)" : "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🔍 AI Scanner
        </button>
      </div>

      {activeTab === "live" ? (
        <>
          {/* Sector Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${filter === s ? "var(--primary)" : "var(--border)"}`,
                  background: filter === s
                    ? "linear-gradient(135deg, rgba(108,92,231,0.15), rgba(0,210,255,0.08))"
                    : "var(--surface)",
                  color: filter === s ? "var(--primary-light)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="cut-input-group" style={{ marginBottom: 16, maxWidth: 400 }}>
            <input
              className="input"
              placeholder="Search by symbol or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="markets-search"
            />
            <label htmlFor="markets-search" className="input-label">Search</label>
          </div>

          {/* Stock Table */}
          <div className="dash-panel" style={{ overflow: "auto" }}>
            {loading && stocks.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="shimmer" style={{ height: 40, borderRadius: 8 }} />
                ))}
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--bearish)" }}>{error}</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Symbol</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Name</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Sector</th>
                    <th
                      style={{ ...thStyle, cursor: "pointer" }}
                      onClick={() => handleSort("price")}
                    >
                      Price {sortBy === "price" && (sortDir === "desc" ? "↓" : "↑")}
                    </th>
                    <th
                      style={{ ...thStyle, cursor: "pointer" }}
                      onClick={() => handleSort("change")}
                    >
                      Change % {sortBy === "change" && (sortDir === "desc" ? "↓" : "↑")}
                    </th>
                    <th
                      style={{ ...thStyle, cursor: "pointer" }}
                      onClick={() => handleSort("volume")}
                    >
                      Volume {sortBy === "volume" && (sortDir === "desc" ? "↓" : "↑")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock, i) => (
                    <tr
                      key={stock.symbol}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "var(--text-primary)" }}>
                        {stock.symbol.replace(".NS", "")}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-secondary)", textAlign: "left" }}>{stock.name}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: "var(--card)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {getSector(stock.symbol)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        ₹{stock.current_price?.toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          color: stock.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)",
                        }}
                      >
                        {stock.change_percent >= 0 ? "+" : ""}{stock.change_percent?.toFixed(2)}%
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-tertiary)" }}>
                        {stock.volume > 1000000
                          ? `${(stock.volume / 1000000).toFixed(1)}M`
                          : stock.volume > 1000
                          ? `${(stock.volume / 1000).toFixed(1)}K`
                          : stock.volume}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filteredStocks.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                No stocks match your search or filter
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Scanner Summary Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 20
          }}>
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">Total Scanned</span>
                <span className="dash-stat-icon">🔍</span>
              </div>
              <div className="dash-stat-value">{scanData?.total_scanned || 0} Stocks</div>
              <span className="dash-stat-change">NSE Top Liquid</span>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">Stocks with Signals</span>
                <span className="dash-stat-icon">⚡</span>
              </div>
              <div className="dash-stat-value" style={{ color: "var(--primary-light)" }}>
                {scanLoading ? "Scanning..." : scanData?.stocks_with_signals || 0}
              </div>
              <span className="dash-stat-change">Active patterns detected</span>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">Last Run Time</span>
                <span className="dash-stat-icon">⏱️</span>
              </div>
              <div className="dash-stat-value" style={{ fontSize: 20 }}>
                {scanLoading ? "Refreshing..." : scanData?.timestamp ? new Date(scanData.timestamp).toLocaleTimeString() : "--:--"}
              </div>
              <button
                onClick={() => fetchScannerData(true)}
                disabled={scanLoading}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: "var(--primary-light)",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  marginTop: 4
                }}
              >
                🔄 Run Manual Scan
              </button>
            </div>
          </div>

          {/* Scanner Table */}
          <div className="dash-panel" style={{ overflow: "auto" }}>
            {scanLoading && (!scanData || scanData.results.length === 0) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="shimmer" style={{ height: 50, borderRadius: 8 }} />
                ))}
              </div>
            ) : scanError ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--bearish)" }}>
                {scanError}
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => fetchScannerData(true)} className="btn btn-primary btn-sm">Retry</button>
                </div>
              </div>
            ) : !scanData || scanData.results.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                No technical signals detected at the moment.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ ...thStyle, textAlign: "left" }}>Symbol</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Price</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Active Signals</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Signal Count</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scanData.results.map((item) => {
                    const isExpanded = expandedScanSymbol === item.symbol;
                    return (
                      <Fragment key={item.symbol}>
                        <tr
                          key={item.symbol}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            transition: "background 0.15s",
                            cursor: "pointer",
                          }}
                          onClick={() => setExpandedScanSymbol(isExpanded ? null : item.symbol)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ ...tdStyle, textAlign: "left", fontWeight: 700, color: "var(--text-primary)" }}>
                            {item.symbol}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "left", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                            ₹{item.price.toLocaleString("en-IN")}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "left" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {item.signals.slice(0, 3).map((sig, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: sig.type === "bullish" ? "var(--bullish-bg)" : sig.type === "bearish" ? "var(--bearish-bg)" : "var(--neutral-bg)",
                                    color: sig.type === "bullish" ? "var(--bullish)" : sig.type === "bearish" ? "var(--bearish)" : "var(--neutral-color)",
                                  }}
                                >
                                  {sig.pattern}
                                </span>
                              ))}
                              {item.signals.length > 3 && (
                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+{item.signals.length - 3} more</span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "var(--primary-light)" }}>
                            {item.signal_count}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <span style={{ fontSize: 12, color: "var(--primary-light)", fontWeight: 600 }}>
                              {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: "rgba(255,255,255,0.01)" }}>
                            <td colSpan={5} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>
                                  Technical Pattern Analysis for {item.symbol}:
                                </div>
                                <div style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                  gap: 16
                                }}>
                                  {item.signals.map((sig, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: 12,
                                        borderRadius: 8,
                                        background: "var(--card)",
                                        borderLeft: `3px solid ${sig.type === "bullish" ? "var(--bullish)" : sig.type === "bearish" ? "var(--bearish)" : "var(--neutral-color)"}`
                                      }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{sig.pattern}</span>
                                        <span style={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          textTransform: "uppercase",
                                          color: sig.type === "bullish" ? "var(--bullish)" : sig.type === "bearish" ? "var(--bearish)" : "var(--neutral-color)"
                                        }}>
                                          {sig.type} · {sig.strength}
                                        </span>
                                      </div>
                                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{sig.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  textAlign: "right",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  textAlign: "right",
};
