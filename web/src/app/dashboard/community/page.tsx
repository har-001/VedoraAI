"use client";

import { useEffect, useState, useCallback } from "react";
import api, { CommunityPostResponse } from "@/lib/api";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Post Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [symbol, setSymbol] = useState("");
  const [attachBacktest, setAttachBacktest] = useState(false);
  const [lastBacktest, setLastBacktest] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getCommunityPosts();
      if (res.ok && res.data) {
        setPosts(res.data);
      } else {
        setError(res.error || "Failed to load community feed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch community posts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for stored backtest on mount / updates
  useEffect(() => {
    document.title = "Community Feed — VedoraAI";
    fetchPosts();

    // Check for last backtest
    const stored = localStorage.getItem("vedora_last_backtest");
    if (stored) {
      try {
        setLastBacktest(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cached backtest:", e);
      }
    }
  }, [fetchPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    try {
      setSubmitting(true);
      const backtestPayload = attachBacktest && lastBacktest ? lastBacktest : undefined;
      const finalSymbol = symbol.trim().toUpperCase() || (backtestPayload ? lastBacktest.symbol : undefined);

      const res = await api.createCommunityPost(
        title.trim(),
        content.trim(),
        finalSymbol,
        backtestPayload
      );

      if (res.ok && res.data) {
        // Prepend new post
        setPosts((prev) => [res.data, ...prev]);
        // Reset form
        setTitle("");
        setContent("");
        setSymbol("");
        setAttachBacktest(false);
      } else {
        alert(res.error || "Failed to submit post.");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting content.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStrategyLabel = (slug: string) => {
    switch (slug) {
      case "sma_crossover":
        return "SMA Crossover Strategy";
      case "rsi_mean_reversion":
        return "RSI Mean Reversion Strategy";
      case "macd_momentum":
        return "MACD Momentum Strategy";
      default:
        return slug;
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div className="dash-welcome" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="dash-welcome-title">👥 Community Sentiment Feed</h1>
          <p className="dash-welcome-sub">Share quantitative backtest results, trade ideas, and discuss market views</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        
        {/* Create Post Form */}
        <div className="dash-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", fontFamily: "var(--font-heading)" }}>
            ✍️ Share a Market View
          </h3>
          <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="cut-input-group">
              <input
                type="text"
                className="input"
                id="post-title"
                placeholder=" "
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <label htmlFor="post-title" className="input-label">Title / Main Idea</label>
            </div>

            <div className="cut-input-group" style={{ height: "auto" }}>
              <textarea
                className="input"
                id="post-content"
                placeholder=" "
                rows={4}
                style={{ height: "auto", minHeight: 100, paddingTop: 12, resize: "vertical" }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <label htmlFor="post-content" className="input-label">Describe your thesis, findings, or analysis...</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="cut-input-group">
                <input
                  type="text"
                  className="input"
                  id="post-symbol"
                  placeholder=" "
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
                <label htmlFor="post-symbol" className="input-label">Asset Symbol (e.g. TCS) - Optional</label>
              </div>

              {/* Backtest Attachment Checkbox */}
              {lastBacktest && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
                  <input
                    type="checkbox"
                    id="attach-backtest-check"
                    checked={attachBacktest}
                    onChange={(e) => setAttachBacktest(e.target.checked)}
                    style={{ cursor: "pointer", width: 16, height: 16 }}
                  />
                  <label htmlFor="attach-backtest-check" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                    Attach Last Backtest: <strong style={{ color: "var(--primary-light)" }}>{lastBacktest.symbol}</strong> ({lastBacktest.metrics.total_return >= 0 ? "+" : ""}{lastBacktest.metrics.total_return}%)
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: "10px 24px", minWidth: 140 }}
              >
                {submitting ? "Posting..." : "🚀 Share Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Community Feed List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Latest Discussions
          </h3>

          {error && (
            <div className="dash-panel" style={{ background: "var(--bearish-bg)", borderColor: "var(--bearish)", color: "var(--bearish)" }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="dash-panel" style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ animation: "pulse-glow 1.5s ease-in-out infinite", fontSize: 24, marginBottom: 8 }}>⚡</div>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading community posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="dash-panel" style={{ textAlign: "center", padding: "60px 40px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
              <h4>No posts yet</h4>
              <p style={{ fontSize: 12, maxWidth: 350, margin: "8px auto 0 auto", lineHeight: 1.5 }}>
                Be the first to share your thoughts, analysis, or quantitative backtest results with the community!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="dash-panel" style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                      {post.title}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        👤 {post.user.full_name}
                      </span>
                      <span>•</span>
                      <span>
                        📅 {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {post.symbol && (
                        <>
                          <span>•</span>
                          <span style={{
                            background: "rgba(108, 92, 231, 0.15)",
                            color: "var(--primary-light)",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 10,
                          }}>
                            {post.symbol}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  margin: "0 0 16px 0",
                  whiteSpace: "pre-line"
                }}>
                  {post.content}
                </p>

                {/* Attached Backtest Card */}
                {post.backtest_result && (
                  <div style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 12,
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      paddingBottom: 8,
                      marginBottom: 12,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                        📊 Attached Backtest: {post.backtest_result.symbol}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {getStrategyLabel(post.backtest_result.strategy)}
                      </span>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 12,
                    }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Return</span>
                        <span style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: post.backtest_result.metrics.total_return >= 0 ? "var(--bullish)" : "var(--bearish)"
                        }}>
                          {post.backtest_result.metrics.total_return >= 0 ? "+" : ""}{post.backtest_result.metrics.total_return}%
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Max Drawdown</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--bearish)" }}>
                          {post.backtest_result.metrics.max_drawdown}%
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Win Rate</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                          {post.backtest_result.metrics.win_rate}%
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Trades</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)" }}>
                          {post.backtest_result.metrics.total_trades}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
