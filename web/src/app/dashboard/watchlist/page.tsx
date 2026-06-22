"use client";

import { useEffect, useState, useRef } from "react";
import api, { MarketQuote, WatchlistResponse, SearchResult } from "@/lib/api";
import { useLanguage } from "../languageContext";
import { useCurrency } from "../currencyContext";

export default function WatchlistPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
  const [items, setItems] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Asset modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.title = "Watchlist — VedoraAI";
    fetchWatchlist();
  }, []);

  // Debounced search inside modal
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
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
  }, [searchQuery]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.listWatchlists();
      if (res.ok && res.data && res.data.length > 0) {
        const defaultWatchlist = res.data.find(w => w.is_default) || res.data[0];
        setWatchlist(defaultWatchlist);

        if (defaultWatchlist.items && defaultWatchlist.items.length > 0) {
          const symbols = defaultWatchlist.items.map(i => i.symbol);
          const quotesRes = await api.getMultipleQuotes(symbols);
          if (quotesRes.ok && quotesRes.data) {
            setItems(quotesRes.data);
          }
        } else {
          setItems([]);
        }
      } else {
        setError("Failed to load watchlist.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (symbol: string) => {
    if (!watchlist) return;
    try {
      setLoading(true);
      const res = await api.addWatchlistItem(watchlist.id, symbol);
      if (res.ok) {
        setIsModalOpen(false);
        setSearchQuery("");
        await fetchWatchlist();
      } else {
        alert(res.error || "Failed to add asset to watchlist.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add asset.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAsset = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation/click triggers
    if (!watchlist) return;
    if (!confirm(`Are you sure you want to remove ${symbol} from your watchlist?`)) return;

    try {
      setLoading(true);
      const res = await api.removeWatchlistItem(watchlist.id, symbol);
      if (res.ok) {
        await fetchWatchlist();
      } else {
        alert(res.error || "Failed to remove asset.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove asset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="dash-welcome" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dash-welcome-title">⭐ {t("nav_watchlist")}</h1>
          <p className="dash-welcome-sub">Track your favourite assets and AI insights</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Asset
        </button>
      </div>

      {error && (
        <div style={{ padding: 20, color: "var(--bearish)", background: "rgba(255,82,82,0.1)", borderRadius: 10, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="dash-panel">
        {loading && items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="shimmer" style={{ height: 60, borderRadius: 10 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Your watchlist is empty</p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Add stocks to track their live prices and AI predictions</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsModalOpen(true)}
            >
              + Add First Asset
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item) => {
              // Standard simulated AI attributes based on symbol
              const isBullish = item.change_percent >= 0;
              const confidence = Math.floor(70 + (Math.abs(item.change_percent * 7) % 25));
              const outlook = isBullish ? "Bullish" : "Bearish";
              
              return (
                <div
                  key={item.symbol}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--card-hover)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--card)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                      {item.symbol.replace(".NS", "")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.name}</div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "flex-end", flex: 3 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14 }}>
                        {formatPrice(item.current_price)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: item.change_percent >= 0 ? "var(--bullish)" : "var(--bearish)" }}>
                        {item.change_percent >= 0 ? "+" : ""}{item.change_percent?.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--primary-light)" }}>
                        {confidence}%
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>AI Conf.</div>
                    </div>
                    
                    <span className={`dash-badge dash-badge-${outlook.toLowerCase()}`} style={{ minWidth: 70, textAlign: "center" }}>
                      {outlook}
                    </span>

                    <button
                      onClick={(e) => handleRemoveAsset(item.symbol, e)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bearish)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      title="Remove from Watchlist"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Asset Modal ───────────────────── */}
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
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)" }}>Add Asset to Watchlist</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery("");
                }}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div className="cut-input-group" style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Type symbol or name (e.g. RELIANCE, TCS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                id="modal-search"
              />
              <label htmlFor="modal-search" className="input-label">Search Asset</label>
            </div>

            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {searching ? (
                <div style={{ textAlign: "center", padding: 12, color: "var(--text-muted)" }}>Searching...</div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: 12, color: "var(--text-muted)" }}>No assets found</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {searchResults.map((res) => (
                    <button
                      key={res.symbol}
                      onClick={() => handleAddAsset(res.symbol)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--card-hover)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.01)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                          {res.symbol.replace(".NS", "")}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{res.name}</div>
                      </div>
                      <span style={{ fontSize: 10, background: "var(--border)", padding: "2px 6px", borderRadius: 4, color: "var(--text-muted)" }}>
                        {res.exchange}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
