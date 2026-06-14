"use client";

import { useEffect, useState, useRef } from "react";
import api, { BacktestResponse, TradeLogItem } from "@/lib/api";

const PRESETS = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "TATAMOTORS", name: "Tata Motors" },
];

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [capital, setCapital] = useState(100000);
  const [range, setRange] = useState("1y");

  // Strategy Parameters
  const [smaFast, setSmaFast] = useState(10);
  const [smaSlow, setSmaSlow] = useState(20);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BacktestResponse | null>(null);

  // SVG Chart Hover State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Strategy Lab — VedoraAI";
  }, []);

  const handleRun = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, number> = {};
      if (strategy === "sma_crossover") {
        params.fast_period = smaFast;
        params.slow_period = smaSlow;
      } else if (strategy === "rsi_mean_reversion") {
        params.rsi_period = rsiPeriod;
        params.oversold_threshold = rsiOversold;
        params.overbought_threshold = rsiOverbought;
      } else if (strategy === "macd_momentum") {
        params.macd_fast = macdFast;
        params.macd_slow = macdSlow;
        params.macd_signal = macdSignal;
      }

      const res = await api.runBacktest({
        symbol,
        strategy,
        parameters: params,
        initial_capital: capital,
        range_period: range,
      });

      if (res.ok && res.data) {
        setResults(res.data);
        localStorage.setItem(
          "vedora_last_backtest",
          JSON.stringify({
            symbol,
            strategy,
            metrics: res.data.metrics,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        setError(res.error || "Failed to execute strategy simulation.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error — is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Render Equity SVG Path ──
  const renderChart = () => {
    if (!results || !results.equity_curve || results.equity_curve.length === 0) return null;

    const width = 800;
    const height = 300;
    const padding = 40;

    const curve = results.equity_curve;
    const n = curve.length;

    // Find min and max for scaling Y
    const equities = curve.map((d) => d.equity);
    const minEq = Math.min(...equities) * 0.98;
    const maxEq = Math.max(...equities) * 1.02;

    const prices = curve.map((d) => d.price);
    const minPr = Math.min(...prices) * 0.98;
    const maxPr = Math.max(...prices) * 1.02;

    // Helper coordinates converters
    const getX = (i: number) => padding + (i / (n - 1)) * (width - 2 * padding);
    const getY = (val: number, min: number, max: number) =>
      height - padding - ((val - min) / (max - min)) * (height - 2 * padding);

    // Build SVG path strings
    let equityPath = "";
    let benchmarkPath = "";

    for (let i = 0; i < n; i++) {
      const x = getX(i);
      const yEq = getY(curve[i].equity, minEq, maxEq);
      const yPr = getY(curve[i].price, minPr, maxPr);

      if (i === 0) {
        equityPath = `M ${x} ${yEq}`;
        benchmarkPath = `M ${x} ${yPr}`;
      } else {
        equityPath += ` L ${x} ${yEq}`;
        benchmarkPath += ` L ${x} ${yPr}`;
      }
    }

    // Handle interactive chart hover
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      if (!chartContainerRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;

      // Map clickX back to nearest data index
      const chartWidth = rect.width;
      const pct = (clickX - (padding / width) * chartWidth) / (((width - 2 * padding) / width) * chartWidth);
      const idx = Math.max(0, Math.min(n - 1, Math.round(pct * (n - 1))));
      setHoverIndex(idx);
    };

    const activePoint = hoverIndex !== null && hoverIndex < n ? curve[hoverIndex] : null;

    return (
      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grids / Axes */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />

          {/* Benchmark line */}
          <path d={benchmarkPath} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />

          {/* Equity line */}
          <path d={equityPath} fill="none" stroke="var(--primary-light)" strokeWidth="3" />

          {/* Hover indicator vertical line */}
          {activePoint && hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={padding}
              x2={getX(hoverIndex)}
              y2={height - padding}
              stroke="var(--border-light)"
              strokeWidth="1.5"
            />
          )}

          {/* Key labels */}
          <text x={padding + 10} y={padding + 15} fill="var(--primary-light)" fontSize="11" fontWeight="700">
            ● Strategy Equity Curve
          </text>
          <text x={padding + 170} y={padding + 15} fill="var(--text-muted)" fontSize="11" fontWeight="700">
            -- Benchmark Asset Price
          </text>
        </svg>

        {/* Floating Tooltip */}
        {activePoint && hoverIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: 45,
              left: `${(getX(hoverIndex) / width) * 100}%`,
              transform: "translateX(-50%)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px",
              boxShadow: "var(--shadow-lg)",
              zIndex: 10,
              pointerEvents: "none",
              minWidth: 150,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
              {activePoint.date}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>Equity:</span>
              <span style={{ color: "var(--primary-light)" }}>₹{activePoint.equity.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span>Asset Price:</span>
              <span>₹{activePoint.price.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="dash-welcome" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dash-welcome-title">🧪 Strategy Lab</h1>
          <p className="dash-welcome-sub">Backtest customized quantitative trading strategies on historical asset data</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        {/* Left Control Panel */}
        <div className="dash-panel" style={{ height: "fit-content", display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: 10, margin: 0 }}>
            Configuration
          </h2>

          {/* Symbol Presets */}
          <div className="cut-input-group">
            <select
              className="input"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              id="backtest-symbol"
              style={{ background: "transparent", color: "var(--text-primary)" }}
            >
              {PRESETS.map((p) => (
                <option key={p.symbol} value={p.symbol} style={{ background: "var(--surface)" }}>
                  {p.symbol} ({p.name})
                </option>
              ))}
            </select>
            <label htmlFor="backtest-symbol" className="input-label">Select Stock</label>
          </div>

          {/* Strategy Selection */}
          <div className="cut-input-group">
            <select
              className="input"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              id="backtest-strategy"
              style={{ background: "transparent", color: "var(--text-primary)" }}
            >
              <option value="sma_crossover" style={{ background: "var(--surface)" }}>SMA Crossover</option>
              <option value="rsi_mean_reversion" style={{ background: "var(--surface)" }}>RSI Mean Reversion</option>
              <option value="macd_momentum" style={{ background: "var(--surface)" }}>MACD Momentum</option>
            </select>
            <label htmlFor="backtest-strategy" className="input-label">Strategy</label>
          </div>

          {/* Dynamic Strategy parameters */}
          {strategy === "sma_crossover" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={smaFast}
                  onChange={(e) => setSmaFast(Number(e.target.value))}
                  id="sma-fast"
                />
                <label htmlFor="sma-fast" className="input-label">Fast SMA Period</label>
              </div>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={smaSlow}
                  onChange={(e) => setSmaSlow(Number(e.target.value))}
                  id="sma-slow"
                />
                <label htmlFor="sma-slow" className="input-label">Slow SMA Period</label>
              </div>
            </div>
          )}

          {strategy === "rsi_mean_reversion" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={rsiPeriod}
                  onChange={(e) => setRsiPeriod(Number(e.target.value))}
                  id="rsi-period"
                />
                <label htmlFor="rsi-period" className="input-label">RSI Window</label>
              </div>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={rsiOversold}
                  onChange={(e) => setRsiOversold(Number(e.target.value))}
                  id="rsi-oversold"
                />
                <label htmlFor="rsi-oversold" className="input-label">Oversold Threshold</label>
              </div>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={rsiOverbought}
                  onChange={(e) => setRsiOverbought(Number(e.target.value))}
                  id="rsi-overbought"
                />
                <label htmlFor="rsi-overbought" className="input-label">Overbought Threshold</label>
              </div>
            </div>
          )}

          {strategy === "macd_momentum" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={macdFast}
                  onChange={(e) => setMacdFast(Number(e.target.value))}
                  id="macd-fast"
                />
                <label htmlFor="macd-fast" className="input-label">Fast Period</label>
              </div>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={macdSlow}
                  onChange={(e) => setMacdSlow(Number(e.target.value))}
                  id="macd-slow"
                />
                <label htmlFor="macd-slow" className="input-label">Slow Period</label>
              </div>
              <div className="cut-input-group">
                <input
                  type="number"
                  className="input"
                  value={macdSignal}
                  onChange={(e) => setMacdSignal(Number(e.target.value))}
                  id="macd-signal"
                />
                <label htmlFor="macd-signal" className="input-label">Signal Period</label>
              </div>
            </div>
          )}

          {/* Initial Capital */}
          <div className="cut-input-group">
            <input
              type="number"
              className="input"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              id="backtest-capital"
            />
            <label htmlFor="backtest-capital" className="input-label">Initial Capital (₹)</label>
          </div>

          {/* Period Range */}
          <div className="cut-input-group">
            <select
              className="input"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              id="backtest-range"
              style={{ background: "transparent", color: "var(--text-primary)" }}
            >
              <option value="3mo" style={{ background: "var(--surface)" }}>3 Months</option>
              <option value="6mo" style={{ background: "var(--surface)" }}>6 Months</option>
              <option value="1y" style={{ background: "var(--surface)" }}>1 Year</option>
              <option value="2y" style={{ background: "var(--surface)" }}>2 Years</option>
            </select>
            <label htmlFor="backtest-range" className="input-label">Simulation Window</label>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "10px", marginTop: 8 }}
          >
            {loading ? "Simulating..." : "🧪 Run Simulation"}
          </button>
        </div>

        {/* Right Output Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {error && (
            <div className="dash-panel" style={{ background: "var(--bearish-bg)", borderColor: "var(--bearish)", color: "var(--bearish)" }}>
              ⚠️ {error}
            </div>
          )}

          {!results && !loading && !error && (
            <div className="dash-panel" style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                No Simulation Data
              </h3>
              <p style={{ maxWidth: 450, margin: "0 auto 0 auto", fontSize: 13, lineHeight: 1.6 }}>
                Choose a stock and configure strategy parameters in the left panel, then click &quot;Run Simulation&quot; to inspect backtesting performance.
              </p>
            </div>
          )}

          {loading && (
            <div className="dash-panel" style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ animation: "pulse-glow 1.5s ease-in-out infinite", fontSize: 48, marginBottom: 16 }}>⚡</div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                Executing Backtest Model...
              </h3>
              <p style={{ maxWidth: 400, margin: "0 auto", fontSize: 13, color: "var(--text-muted)" }}>
                Fetching historical price records and running trading rules in real-time. Please wait.
              </p>
            </div>
          )}

          {results && !loading && (
            <>
              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Net Strategy Return</span>
                  <div
                    className="dash-stat-value"
                    style={{ color: results.metrics.total_return >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                  >
                    {results.metrics.total_return >= 0 ? "+" : ""}{results.metrics.total_return}%
                  </div>
                  <span className="dash-stat-change">Ending: ₹{results.metrics.final_value.toLocaleString("en-IN")}</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Benchmark Return</span>
                  <div
                    className="dash-stat-value"
                    style={{ color: results.metrics.benchmark_return >= 0 ? "var(--bullish)" : "var(--bearish)" }}
                  >
                    {results.metrics.benchmark_return >= 0 ? "+" : ""}{results.metrics.benchmark_return}%
                  </div>
                  <span className="dash-stat-change">Buy & Hold Return</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Sharpe Ratio</span>
                  <div className="dash-stat-value" style={{ color: results.metrics.sharpe_ratio > 1.0 ? "var(--bullish)" : "var(--text-primary)" }}>
                    {results.metrics.sharpe_ratio}
                  </div>
                  <span className="dash-stat-change">Risk-Adjusted Metric</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Max Drawdown</span>
                  <div className="dash-stat-value" style={{ color: "var(--bearish)" }}>
                    {results.metrics.max_drawdown}%
                  </div>
                  <span className="dash-stat-change">Peak-to-Trough Decline</span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Win Rate</span>
                  <div className="dash-stat-value">
                    {results.metrics.win_rate}%
                  </div>
                  <span className="dash-stat-change">{results.metrics.total_trades} trades completed</span>
                </div>
              </div>

              {/* Chart */}
              <div className="dash-panel" ref={chartContainerRef}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>
                  📈 Equity Growth Comparison
                </h3>
                {renderChart()}
              </div>

              {/* Trade Log */}
              <div className="dash-panel" style={{ overflow: "auto" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>
                  📋 Transactions History
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)" }}>Action</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--text-muted)" }}>Execution Price</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--text-muted)" }}>Quantity</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--text-muted)" }}>Trade Value</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--text-muted)" }}>P&L</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--text-muted)" }}>Capital Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.trade_log.map((trade: TradeLogItem, i: number) => {
                      const isBuy = trade.action === "BUY";
                      const isSell = trade.action.startsWith("SELL");
                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: isBuy ? "rgba(0, 230, 118, 0.01)" : isSell ? "rgba(255, 82, 82, 0.01)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{trade.date}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isBuy ? "var(--bullish-bg)" : "var(--bearish-bg)",
                              color: isBuy ? "var(--bullish)" : "var(--bearish)"
                            }}>
                              {trade.action}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                            ₹{trade.price.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>{trade.quantity}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                            ₹{trade.value.toLocaleString("en-IN")}
                          </td>
                          <td style={{
                            padding: "10px 12px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: trade.pnl > 0 ? "var(--bullish)" : trade.pnl < 0 ? "var(--bearish)" : "var(--text-secondary)"
                          }}>
                            {trade.pnl > 0 ? "+" : ""}{trade.pnl !== 0 ? `₹${trade.pnl.toLocaleString("en-IN")}` : "—"}
                            {trade.pnl_percent !== 0 && (
                              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>
                                ({trade.pnl_percent > 0 ? "+" : ""}{trade.pnl_percent}%)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                            ₹{trade.balance.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
