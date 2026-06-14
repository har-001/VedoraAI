"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import api, { AlertResponse } from "@/lib/api";

const navItems = [
  { icon: "📊", label: "Overview", href: "/dashboard" },
  { icon: "📈", label: "Markets", href: "/dashboard/markets" },
  { icon: "⭐", label: "Watchlist", href: "/dashboard/watchlist" },
  { icon: "💼", label: "Portfolio", href: "/dashboard/portfolio" },
  { icon: "🧪", label: "Strategy Lab", href: "/dashboard/backtest" },
  { icon: "👥", label: "Community", href: "/dashboard/community" },
  { icon: "🤖", label: "AI Predictions", href: "/dashboard/predictions" },
  { icon: "📰", label: "News", href: "/dashboard/news" },
  { icon: "🧠", label: "AI Coach", href: "/dashboard/coach" },
  { icon: "🎓", label: "Learn", href: "/dashboard/learn" },
];


const bottomNavItems = [
  { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Alerts State ──
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // New alert form state
  const [alertSymbol, setAlertSymbol] = useState("");
  const [alertType, setAlertType] = useState("price_above");
  const [alertTargetValue, setAlertTargetValue] = useState("");
  const [alertPatternName, setAlertPatternName] = useState("Golden Cross");

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.getAlerts();
      if (res.ok && res.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  }, []);

  const checkAlerts = useCallback(async () => {
    try {
      const res = await api.checkAlerts();
      if (res.ok && res.data) {
        setAlerts(res.data.all_alerts);
      }
    } catch (err) {
      console.error("Error checking alerts:", err);
    }
  }, []);

  const handleDeleteAlert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  const handleCreateAlert = async () => {
    if (!alertSymbol) return;
    try {
      const targetVal = alertType !== "technical_pattern" ? parseFloat(alertTargetValue) : undefined;
      const patName = alertType === "technical_pattern" ? alertPatternName : undefined;
      const res = await api.createAlert(alertSymbol, alertType, targetVal, patName);
      if (res.ok && res.data) {
        setAlerts((prev) => [res.data, ...prev]);
        setModalOpen(false);
        setAlertSymbol("");
        setAlertTargetValue("");
      } else {
        alert(res.error || "Failed to create alert");
      }
    } catch (err) {
      alert("Error creating alert");
    }
  };

  const triggeredCount = alerts.filter(a => a.is_triggered).length;

  useEffect(() => {
    const token = localStorage.getItem("vedora_token");
    const userData = localStorage.getItem("vedora_user");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { /* ignore */ }
    }
    fetchAlerts();
    const interval = setInterval(checkAlerts, 20000);
    return () => clearInterval(interval);
  }, [router, fetchAlerts, checkAlerts]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleString("en-IN", {
          weekday: "short", day: "numeric", month: "short",
          hour: "2-digit", minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Keyboard shortcut: Ctrl+K for search ──── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("vedora_token");
    localStorage.removeItem("vedora_refresh_token");
    localStorage.removeItem("vedora_user");
    router.push("/auth/login");
  }, [router]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="dashboard-layout">
      {/* ── Mobile Sidebar Overlay ─────────────── */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────── */}
      <aside
        className={`dashboard-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/" className="sidebar-brand">
            <div className="sidebar-brand-icon">V</div>
            {!sidebarCollapsed && (
              <span className="sidebar-brand-text">
                Vedora<span className="sidebar-brand-accent">AI</span>
              </span>
            )}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            {!sidebarCollapsed && (
              <span className="sidebar-nav-label">MAIN</span>
            )}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href) ? "active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="sidebar-nav-text">{item.label}</span>
                )}
                {isActive(item.href) && <div className="sidebar-active-indicator" />}
              </Link>
            ))}
          </div>

          <div className="sidebar-nav-divider" />

          <div className="sidebar-nav-group">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href) ? "active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="sidebar-nav-text">{item.label}</span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info at bottom */}
        {!sidebarCollapsed && user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.full_name}</div>
              <div className="sidebar-user-plan">Free Plan</div>
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Area ──────────────────────────── */}
      <div className="dashboard-main">
        {/* ── Top Header ───────────────────────── */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Search bar */}
            <div className="header-search-wrapper">
              <button
                className="header-search-btn"
                onClick={() => setSearchOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="header-search-placeholder">Search assets, strategies...</span>
                <kbd className="header-search-kbd">⌘K</kbd>
              </button>
            </div>
          </div>

          <div className="dashboard-header-right">
            <span className="header-time">{currentTime}</span>

            {/* Market status indicator */}
            <div className="market-status-pill">
              <span className="market-status-dot" />
              <span className="market-status-text">Market Open</span>
            </div>

            {/* Notifications / Alerts */}
            <div className="alerts-wrapper">
              <button 
                className="header-icon-btn" 
                id="notifications-btn"
                onClick={() => setAlertsOpen(!alertsOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {triggeredCount > 0 && (
                  <span className="notification-badge">{triggeredCount}</span>
                )}
              </button>

              {alertsOpen && (
                <div className="alerts-dropdown">
                  <div className="alerts-dropdown-header">
                    <span className="alerts-dropdown-title">Price & Pattern Alerts</span>
                    <div className="alerts-dropdown-actions">
                      <button 
                        className="alerts-dropdown-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          checkAlerts();
                        }}
                      >
                        🔄 Check
                      </button>
                    </div>
                  </div>

                  <div className="alerts-dropdown-list">
                    {alerts.length === 0 ? (
                      <div className="alerts-dropdown-empty">
                        No alerts configured.
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`alerts-dropdown-item ${alert.is_triggered ? 'triggered' : ''}`}
                        >
                          <div className="alerts-dropdown-item-main">
                            <div className="alerts-dropdown-item-symbol">
                              {alert.symbol}
                              <span className={`alerts-dropdown-item-badge ${alert.is_triggered ? 'triggered' : 'active'}`}>
                                {alert.is_triggered ? 'Triggered' : 'Active'}
                              </span>
                            </div>
                            <div className="alerts-dropdown-item-desc">
                              {alert.alert_type === "price_above" && `Price >= ₹${alert.target_value}`}
                              {alert.alert_type === "price_below" && `Price <= ₹${alert.target_value}`}
                              {alert.alert_type === "technical_pattern" && `${alert.pattern_name} pattern`}
                            </div>
                            {alert.triggered_at && (
                              <div className="alerts-dropdown-item-time">
                                Triggered: {new Date(alert.triggered_at).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                          <button 
                            className="alerts-dropdown-item-delete"
                            onClick={(e) => handleDeleteAlert(alert.id, e)}
                            title="Delete alert"
                          >
                            ❌
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="alerts-dropdown-footer">
                    <button 
                      className="alerts-dropdown-footer-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalOpen(true);
                        setAlertsOpen(false);
                      }}
                    >
                      + Create Alert
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="header-user-avatar">
              {user?.full_name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* ── Page Content ─────────────────────── */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>

      {/* ── Command Palette (Search Modal) ─────── */}
      {searchOpen && (
        <div className="command-palette-overlay" onClick={() => setSearchOpen(false)}>
          <div className="command-palette" onClick={(e) => e.stopPropagation()}>
            <div className="command-palette-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="command-palette-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="command-palette-input"
                placeholder="Search stocks, crypto, strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="command-palette-esc">ESC</kbd>
            </div>
            <div className="command-palette-body">
              {!searchQuery && (
                <div className="command-palette-section">
                  <div className="command-palette-section-title">Quick Actions</div>
                  <div className="command-palette-items">
                    {[
                      { icon: "📊", label: "Market Overview", desc: "View indices & top movers" },
                      { icon: "🤖", label: "AI Predictions", desc: "Latest prediction signals" },
                      { icon: "⭐", label: "My Watchlist", desc: "Tracked assets" },
                      { icon: "🧠", label: "Ask AI Coach", desc: "Get market insights" },
                    ].map((item) => (
                      <button key={item.label} className="command-palette-item">
                        <span className="command-palette-item-icon">{item.icon}</span>
                        <div>
                          <div className="command-palette-item-label">{item.label}</div>
                          <div className="command-palette-item-desc">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchQuery && (
                <div className="command-palette-section">
                  <div className="command-palette-section-title">Searching for &ldquo;{searchQuery}&rdquo;...</div>
                  <div className="command-palette-empty">
                    <p>Type a stock symbol or name to search</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Connect to backend for live results
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Alert Modal ─────── */}
      {modalOpen && (
        <div className="alerts-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="alerts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <span className="alerts-modal-title">Create Alert</span>
              <button className="alerts-modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="alerts-modal-body">
              <div className="alerts-form-group">
                <label className="alerts-form-label">Symbol</label>
                <input 
                  type="text" 
                  className="alerts-form-input" 
                  placeholder="e.g. RELIANCE, TCS, HDFCBANK"
                  value={alertSymbol}
                  onChange={(e) => setAlertSymbol(e.target.value)}
                />
              </div>

              <div className="alerts-form-group">
                <label className="alerts-form-label">Alert Type</label>
                <select 
                  className="alerts-form-select"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                >
                  <option value="price_above">Price Crosses Above (&gt;=)</option>
                  <option value="price_below">Price Crosses Below (&lt;=)</option>
                  <option value="technical_pattern">Technical Scanner Pattern</option>
                </select>
              </div>

              {alertType !== "technical_pattern" ? (
                <div className="alerts-form-group">
                  <label className="alerts-form-label">Target Price (₹)</label>
                  <input 
                    type="number" 
                    className="alerts-form-input" 
                    placeholder="e.g. 2500"
                    value={alertTargetValue}
                    onChange={(e) => setAlertTargetValue(e.target.value)}
                  />
                </div>
              ) : (
                <div className="alerts-form-group">
                  <label className="alerts-form-label">Pattern Name</label>
                  <select 
                    className="alerts-form-select"
                    value={alertPatternName}
                    onChange={(e) => setAlertPatternName(e.target.value)}
                  >
                    <option value="Golden Cross">Golden Cross</option>
                    <option value="Death Cross">Death Cross</option>
                    <option value="RSI Oversold">RSI Oversold</option>
                    <option value="RSI Overbought">RSI Overbought</option>
                    <option value="MACD Bullish Crossover">MACD Bullish Crossover</option>
                    <option value="MACD Bearish Crossover">MACD Bearish Crossover</option>
                  </select>
                </div>
              )}
            </div>
            <div className="alerts-modal-footer">
              <button className="alerts-modal-btn cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="alerts-modal-btn confirm" onClick={handleCreateAlert}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
