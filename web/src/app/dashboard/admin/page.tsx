"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface PlatformStats {
  total_users: number;
  pro_users: number;
  free_users: number;
  inactive_users: number;
  total_alerts: number;
  triggered_alerts: number;
  total_community_posts: number;
  total_predictions: number;
  db_status: string;
  scanner_last_run: string | null;
}

interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  subscription_tier: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterTier, setFilterTier] = useState("");
  
  // UI States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [triggeringScan, setTriggeringScan] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // User Editing States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editTier, setEditTier] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Platform Administration — VedoraAI";
    
    // Check if user is admin
    const userData = localStorage.getItem("vedora_user");
    if (userData) {
      try {
        const u = JSON.parse(userData);
        if (u.role === "admin" || u.role === "superadmin") {
          setIsAdmin(true);
          fetchStats();
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, page, filterRole, filterTier]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get<PlatformStats>("/admin/stats");
      if (res.ok && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load platform stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (filterRole) params.append("role", filterRole);
      if (filterTier) params.append("subscription_tier", filterTier);

      const res = await api.get<{ users: UserListItem[]; total_count: number }>("/admin/users?" + params.toString());
      if (res.ok && res.data) {
        setUsers(res.data.users);
        setTotalCount(res.data.total_count);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const startEditUser = (user: UserListItem) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditTier(user.subscription_tier);
    setEditIsActive(user.is_active);
  };

  const saveUserChanges = async (userId: string) => {
    try {
      setSavingUserId(userId);
      const res = await api.put<UserListItem>(`/admin/users/${userId}`, {
        role: editRole,
        subscription_tier: editTier,
        is_active: editIsActive,
      });

      if (res.ok && res.data) {
        // Update user row in table
        setUsers(prev => prev.map(u => u.id === userId ? res.data! : u));
        setEditingUserId(null);
        fetchStats(); // Stats like pro/free users count might change
      } else {
        alert(res.error || "Failed to update user status");
      }
    } catch (err) {
      alert("Error saving user status changes");
    } finally {
      setSavingUserId(null);
    }
  };

  const triggerScannerRun = async () => {
    try {
      setTriggeringScan(true);
      setScanMessage(null);
      const res = await api.post<{ status: string; message: string; assets_scanned: number }>("/admin/scanner/trigger");
      
      if (res.ok && res.data) {
        setScanMessage({
          type: "success",
          text: `Scanner ran successfully. Scanned ${res.data.assets_scanned} assets.`,
        });
        fetchStats();
      } else {
        setScanMessage({
          type: "error",
          text: res.error || "Failed to trigger technical pattern scanner.",
        });
      }
    } catch (err) {
      setScanMessage({
        type: "error",
        text: "Network error triggering scanner.",
      });
    } finally {
      setTriggeringScan(false);
    }
  };

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="glass-card max-w-md p-8 flex flex-col items-center gap-6" style={{ background: "#1a1235", borderColor: "rgba(255, 75, 75, 0.2)" }}>
          <div className="w-16 h-16 rounded-full bg-[rgba(255,82,82,0.1)] flex items-center justify-center text-3xl">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Platform administration requires advanced security authorization. Your current profile does not possess admin privileges.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="btn btn-secondary btn-sm"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const freeUsersPercent = stats ? Math.round((stats.free_users / stats.total_users) * 100) : 50;
  const proUsersPercent = stats ? Math.round((stats.pro_users / stats.total_users) * 100) : 50;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Platform Administration
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Monitor backend analytics, configure parameters, and manage user authorizations.
          </p>
        </div>

        <button
          onClick={triggerScannerRun}
          disabled={triggeringScan}
          className="btn btn-primary flex items-center gap-2"
        >
          {triggeringScan ? "Scanning..." : "⚡ Trigger Technical Scan"}
        </button>
      </div>

      {scanMessage && (
        <div 
          className="p-4 rounded-xl text-sm flex items-center justify-between border"
          style={{
            background: scanMessage.type === "success" ? "var(--bullish-bg)" : "var(--bearish-bg)",
            color: scanMessage.type === "success" ? "var(--bullish)" : "var(--bearish)",
            borderColor: scanMessage.type === "success" ? "rgba(46, 213, 115, 0.2)" : "rgba(255, 82, 82, 0.2)",
          }}
        >
          <span>{scanMessage.text}</span>
          <button onClick={() => setScanMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Total Userbase
          </div>
          <div className="text-3xl font-bold">
            {loadingStats ? "..." : stats?.total_users}
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            Active verified traders on platform
          </div>
          <div className="absolute right-3 bottom-3 text-2xl opacity-10">👥</div>
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Conversion Ratio
          </div>
          <div className="text-3xl font-bold">
            {loadingStats ? "..." : `${proUsersPercent}%`}
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            Pro members: {stats?.pro_users} / Free: {stats?.free_users}
          </div>
          <div className="absolute right-3 bottom-3 text-2xl opacity-10">💰</div>
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Total User Alerts
          </div>
          <div className="text-3xl font-bold">
            {loadingStats ? "..." : stats?.total_alerts}
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            Triggered count: {stats?.triggered_alerts} alerts
          </div>
          <div className="absolute right-3 bottom-3 text-2xl opacity-10">🔔</div>
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Core AI Predictions
          </div>
          <div className="text-3xl font-bold">
            {loadingStats ? "..." : stats?.total_predictions}
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            Total Technical & XGBoost runs
          </div>
          <div className="absolute right-3 bottom-3 text-2xl opacity-10">🧠</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">User Authority Management</h2>

            {/* Filter bar */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input text-sm flex-1 min-w-[200px]"
                style={{ padding: "8px 12px" }}
              />

              <select
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                className="input text-sm"
                style={{ width: "auto", padding: "8px 12px" }}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>

              <select
                value={filterTier}
                onChange={(e) => { setFilterTier(e.target.value); setPage(1); }}
                className="input text-sm"
                style={{ width: "auto", padding: "8px 12px" }}
              >
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>

              <button type="submit" className="btn btn-secondary btn-sm">Filter</button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <th className="pb-3 text-muted">User details</th>
                    <th className="pb-3 text-muted">Role</th>
                    <th className="pb-3 text-muted">Tier</th>
                    <th className="pb-3 text-muted">Status</th>
                    <th className="pb-3 text-right text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted">Loading user accounts...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted">No accounts match selected parameters.</td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr 
                        key={u.id} 
                        className="border-b hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}
                      >
                        <td className="py-3">
                          <div className="font-semibold">{u.full_name}</div>
                          <div className="text-xs text-muted">{u.email}</div>
                        </td>
                        <td className="py-3">
                          {editingUserId === u.id ? (
                            <select 
                              value={editRole} 
                              onChange={(e) => setEditRole(e.target.value)}
                              className="input text-xs"
                              style={{ width: "auto", padding: "4px 8px" }}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="moderator">moderator</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.role === "admin" ? "bg-[rgba(108,92,231,0.2)] text-primary-light" : "bg-[rgba(255,255,255,0.08)]"}`}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {editingUserId === u.id ? (
                            <select 
                              value={editTier} 
                              onChange={(e) => setEditTier(e.target.value)}
                              className="input text-xs"
                              style={{ width: "auto", padding: "4px 8px" }}
                            >
                              <option value="free">free</option>
                              <option value="pro">pro</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.subscription_tier === "pro" ? "bg-[rgba(241,196,15,0.15)] text-[#f1c40f]" : "bg-[rgba(255,255,255,0.08)]"}`}>
                              {u.subscription_tier}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {editingUserId === u.id ? (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editIsActive} 
                                onChange={(e) => setEditIsActive(e.target.checked)}
                              />
                              <span className="text-xs">Active</span>
                            </label>
                          ) : (
                            <span className={`text-xs ${u.is_active ? "text-bullish" : "text-bearish"}`}>
                              {u.is_active ? "Active" : "Banned"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {editingUserId === u.id ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingUserId(null)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => saveUserChanges(u.id)}
                                disabled={savingUserId === u.id}
                                className="btn btn-primary"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                              >
                                {savingUserId === u.id ? "Saving..." : "Save"}
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditUser(u)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Modify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-5 text-sm">
                <span className="text-muted">
                  Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} users
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px" }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Diagnostics & Config */}
        <div className="flex flex-col gap-6">
          {/* Visual SVG Conversion chart */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Membership Split</h2>
            <div className="flex flex-col items-center justify-center p-3">
              {/* Pure SVG Donut allocation */}
              <svg width="160" height="160" viewBox="0 0 160 160" className="mb-4">
                {/* Free Circle Segment */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#2c3e50"
                  strokeWidth="16"
                />
                {/* Pro Circle Segment */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#f1c40f"
                  strokeWidth="16"
                  strokeDasharray={`${(proUsersPercent / 100) * 377} 377`}
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
                {/* Center text */}
                <text x="80" y="76" textAnchor="middle" fill="var(--text-main)" fontSize="20" fontWeight="bold">
                  {proUsersPercent}%
                </text>
                <text x="80" y="96" textAnchor="middle" fill="var(--text-muted)" fontSize="11">
                  Pro Users
                </text>
              </svg>

              <div className="w-full flex justify-around text-xs mt-2 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#f1c40f]" />
                  <span>Pro ({stats?.pro_users || 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#2c3e50]" />
                  <span>Free ({stats?.free_users || 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Parameters */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Diagnostics & Engine Health</h2>
            
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-muted">Database Engine</span>
                <span className="font-semibold text-bullish">SQLite Connected</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-muted">Prediction Horizon</span>
                <span className="font-semibold">Intraday, 1D, 7D</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-muted">Scanner Last Run</span>
                <span className="font-semibold text-right" style={{ fontSize: "11px" }}>
                  {stats?.scanner_last_run 
                    ? new Date(stats.scanner_last_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : "Never"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Scanner Confidence Limit</span>
                  <span className="font-bold text-primary-light">70% (Locked)</span>
                </div>
                <div className="w-full h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <div className="h-full bg-primary-light rounded-full" style={{ width: "70%" }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Sentiment Buffer Size</span>
                  <span className="font-bold text-primary-light">100 articles</span>
                </div>
                <div className="w-full h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
