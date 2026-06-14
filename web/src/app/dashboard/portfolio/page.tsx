"use client";

import { useEffect, useState, useRef } from "react";
import api, { MarketQuote, PortfolioResponse, HoldingResponse, SearchResult } from "@/lib/api";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [holdings, setHoldings] = useState<(HoldingResponse & { currentPrice: number; name: string })[]>([]);
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
    document.title = "Portfolio — VedoraAI";
    fetchPortfolio();
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

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.listPortfolios();
      if (res.ok && res.data && res.data.length > 0) {
        const defaultPortfolio = res.data.find(p => p.is_default) || res.data[0];
        setPortfolio(defaultPortfolio);

        if (defaultPortfolio.holdings && defaultPortfolio.holdings.length > 0) {
          const symbols = defaultPortfolio.holdings.map(h => h.symbol);
          const quotesRes = await api.getMultipleQuotes(symbols);
          if (quotesRes.ok && quotesRes.data) {
            const enriched = defaultPortfolio.holdings.map((holding) => {
              const quote = quotesRes.data?.find(q => q.symbol === holding.symbol) || 
                            quotesRes.data?.find(q => q.symbol.replace(".NS", "") === holding.symbol);
              return {
                ...holding,
                currentPrice: quote?.current_price || holding.avg_buy_price,
                name: quote?.name || "Asset Name",
              };
            });
            setHoldings(enriched);
          } else {
            // If quotes API fails, fallback to using buy price as current price
            setHoldings(defaultPortfolio.holdings.map(h => ({ ...h, currentPrice: h.avg_buy_price, name: h.symbol })));
          }
        } else {
          setHoldings([]);
        }
      } else {
        setError("Failed to load portfolio.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio || !selectedAsset) return;
    const qty = parseFloat(quantity);
    const buyPrice = parseFloat(avgPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(buyPrice) || buyPrice <= 0) {
      alert("Please enter valid quantity and price.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.addHolding(portfolio.id, selectedAsset.symbol, qty, buyPrice, notes);
      if (res.ok) {
        setIsModalOpen(false);
        // Reset state
        setSelectedAsset(null);
        setSearchQuery("");
        setQuantity("");
        setAvgPrice("");
        setNotes("");
        await fetchPortfolio();
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
    if (!portfolio) return;
    if (!confirm(`Are you sure you want to remove all holdings of ${symbol}?`)) return;

    try {
      setLoading(true);
      const res = await api.removeHolding(portfolio.id, symbol);
      if (res.ok) {
        await fetchPortfolio();
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

  const totalInvested = holdings.reduce((s, h) => s + h.quantity * h.avg_buy_price, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <h1 className="dash-welcome-title" style={{ marginBottom: 4 }}>💼 Portfolio Tracker</h1>
          <p className="dash-welcome-sub">Track your hypothetical holdings and P&L (not real trading)</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Holding
        </button>
      </div>

      {error && (
        <div style={{ padding: 20, color: "var(--bearish)", background: "rgba(255,82,82,0.1)", borderRadius: 10, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="dash-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Invested", value: `₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, icon: "💰" },
          { label: "Current Value", value: `₹${totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, icon: "📊" },
          {
            label: "P&L",
            icon: totalPL >= 0 ? "📈" : "📉",
            value: `${totalPL >= 0 ? "+" : ""}₹${Math.abs(totalPL).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
            color: totalPL >= 0 ? "var(--bullish)" : "var(--bearish)",
          },
          {
            label: "Returns",
            value: `${totalPLPercent >= 0 ? "+" : ""}${totalPLPercent.toFixed(2)}%`,
            icon: "🎯",
            color: totalPLPercent >= 0 ? "var(--bullish)" : "var(--bearish)",
          },
        ].map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-header">
              <span className="dash-stat-label">{s.label}</span>
              <span className="dash-stat-icon">{s.icon}</span>
            </div>
            <div className="dash-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div className="dash-panel">
        <div className="dash-section-header" style={{ marginBottom: 14 }}>
          <h2 className="dash-section-title">Holdings</h2>
        </div>
        {loading && holdings.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer" style={{ height: 50, borderRadius: 10 }} />
            ))}
          </div>
        ) : holdings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No holdings tracked yet</p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Add stocks you own to track their live valuation</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsModalOpen(true)}
            >
              + Add First Holding
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {holdings.map((h) => {
              const pl = (h.currentPrice - h.avg_buy_price) * h.quantity;
              const pct = h.avg_buy_price > 0 ? (pl / (h.avg_buy_price * h.quantity)) * 100 : 0;
              return (
                <div
                  key={h.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.5fr 0.5fr",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                      {h.symbol.replace(".NS", "")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{h.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Qty</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{h.quantity}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Avg Price</div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "var(--font-mono)" }}>
                      ₹{h.avg_buy_price.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>LTP</div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "var(--font-mono)" }}>
                      ₹{h.currentPrice.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>P&L</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: pl >= 0 ? "var(--bullish)" : "var(--bearish)" }}>
                      {pl >= 0 ? "+" : ""}₹{Math.abs(pl).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ({pl >= 0 ? "+" : ""}{pct.toFixed(2)}%)
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
              );
            })}
          </div>
        )}
      </div>

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
                            setAvgPrice(String(res.score || "")); // use score as temporary fallback or keep empty
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
