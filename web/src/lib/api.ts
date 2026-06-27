/**
 * VedoraAI — API Client
 * Centralized HTTP client for backend communication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/* ── Market Data Types ───────────────────────── */
export interface MarketQuote {
  symbol: string;
  raw_symbol?: string;
  name: string;
  exchange: string;
  currency: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  market_state: string;
  timestamp: string;
  error?: string;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SectorData {
  name: string;
  change_percent: number;
  stocks: number;
  status: "bullish" | "bearish" | "neutral";
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  score: number;
}

export interface WatchlistItemResponse {
  id: string;
  symbol: string;
  sort_order: number;
  added_at: string;
}

export interface WatchlistResponse {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  items: WatchlistItemResponse[];
}

export interface HoldingResponse {
  id: string;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  notes?: string;
  created_at: string;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  holdings: HoldingResponse[];
}

export interface PredictionData {
  symbol: string;
  raw_symbol?: string;
  name: string;
  confidence: number;
  outlook: "Bullish" | "Bearish" | "Neutral";
  risk: "Low" | "Moderate" | "High";
  current_price: number;
  target_low: number;
  target_high: number;
  target: string;
  horizon: string;
  reasons: string[];
  model_accuracy: number;
  bullish_probability: number;
  indicators: {
    rsi: number | null;
    macd: number | null;
    adx: number | null;
    atr: number | null;
    bb_width: number | null;
  };
  timestamp: string;
  error?: string;
}

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  link: string;
  published: string;
  time_ago: string;
  sentiment: {
    score: number;
    label: "bullish" | "bearish" | "neutral";
    bull_count: number;
    bear_count: number;
  };
  impact: "bullish" | "bearish" | "neutral";
  category: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ScanSignal {
  pattern: string;
  type: "bullish" | "bearish" | "neutral";
  strength: "strong" | "moderate" | "weak";
  description: string;
}

export interface ScanItem {
  symbol: string;
  raw_symbol: string;
  price: number;
  signals: ScanSignal[];
  signal_count: number;
}

export interface ScanResponse {
  results: ScanItem[];
  total_scanned: number;
  stocks_with_signals: number;
  timestamp: string;
}

export interface BacktestRequest {
  symbol: string;
  strategy: string;
  parameters: Record<string, any>;
  initial_capital: number;
  range_period: string;
}

export interface BacktestMetrics {
  initial_capital: number;
  final_value: number;
  total_return: number;
  benchmark_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  profit_factor: number;
}

export interface TradeLogItem {
  date: string;
  action: "BUY" | "SELL" | "SELL_CLOSE";
  price: number;
  quantity: number;
  value: number;
  pnl: number;
  pnl_percent: number;
  balance: number;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  price: number;
  cash: number;
  holdings: number;
}

export interface BacktestResponse {
  metrics: BacktestMetrics;
  equity_curve: EquityCurvePoint[];
  trade_log: TradeLogItem[];
  error?: string;
}

export interface UserMinResponse {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export interface CommunityPostResponse {
  id: string;
  user_id: string;
  title: string;
  content: string;
  symbol?: string;
  backtest_result?: any;
  created_at: string;
  user: UserMinResponse;
}

export interface AlertResponse {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: string;
  target_value?: number;
  pattern_name?: string;
  is_triggered: boolean;
  created_at: string;
  triggered_at?: string;
}

export interface CheckAlertsResponse {
  triggered: AlertResponse[];
  all_alerts: AlertResponse[];
}

export interface StockDetailResponse {
  symbol: string;
  raw_symbol: string;
  name: string;
  exchange: string;
  currency: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  market_state: string;
  stats: {
    week52_high: number;
    week52_low: number;
    avg_volume: number;
    sma_50: number;
    sma_200: number;
  };
  performance: {
    "1d": number;
    "1w": number;
    "1m": number;
    "3m": number;
    "6m": number;
  };
  chart_6m: ChartCandle[];
  chart_1y: ChartCandle[];
  error?: string;
}

export interface PortfolioAnalyticsHolding {
  symbol: string;
  name: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  current_value: number;
  invested_value: number;
  pnl: number;
  pnl_percent: number;
  day_change: number;
  sector: string;
  weight: number;
}

export interface PortfolioAnalyticsSector {
  sector: string;
  value: number;
  weight: number;
  count: number;
}

export interface PortfolioAnalyticsResponse {
  portfolio_id: string;
  portfolio_name: string;
  total_value: number;
  total_invested: number;
  total_pnl: number;
  total_pnl_percent: number;
  allocation: PortfolioAnalyticsHolding[];
  sector_allocation: PortfolioAnalyticsSector[];
  risk_metrics: {
    total_holdings: number;
    total_sectors: number;
    concentration_top: number;
    diversification_score: number;
    largest_position: string | null;
    volatility_label: string;
  };
  top_performers: PortfolioAnalyticsHolding[];
  bottom_performers: PortfolioAnalyticsHolding[];
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  symbol: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationSummaryResponse {
  notifications: NotificationResponse[];
  unread_count: number;
  total: number;
}

interface ApiOptions extends RequestInit {

  token?: string;
}

interface ApiResponse<T> {
  data: T;
  ok: boolean;
  status: number;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("vedora_token", token);
    } else {
      localStorage.removeItem("vedora_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("vedora_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, ...fetchOptions } = options;
    const authToken = token || this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: data as T,
          ok: false,
          status: response.status,
          error: data?.detail || `HTTP ${response.status}`,
        };
      }

      return {
        data: data as T,
        ok: true,
        status: response.status,
      };
    } catch (error) {
      return {
        data: null as T,
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // ── Auth ────────────────────────────────────
  async register(email: string, password: string, fullName: string, phone?: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName, phone }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: {
        id: string;
        email: string;
        full_name: string;
        avatar_url: string | null;
        role: string;
        is_verified: boolean;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async sendOTP(phone?: string, email?: string, purpose: string = "login") {
    return this.request("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone, email, purpose }),
    });
  }

  async verifyOTP(code: string, phone?: string, email?: string, purpose: string = "login") {
    return this.request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ code, phone, email, purpose }),
    });
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getMe() {
    return this.request("/auth/me");
  }

  async logout() {
    const result = await this.request("/auth/logout", { method: "POST" });
    this.setToken(null);
    localStorage.removeItem("vedora_refresh_token");
    return result;
  }

  // ── Users ───────────────────────────────────
  async getProfile() {
    return this.request("/users/me");
  }

  async updateProfile(data: Record<string, unknown>) {
    return this.request("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updatePreferences(preferences: Record<string, unknown>) {
    return this.request("/users/me/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }

  async getDevices() {
    return this.request("/users/me/devices");
  }

  async getLoginHistory(limit: number = 20) {
    return this.request(`/users/me/login-history?limit=${limit}`);
  }

  // ── Market Data ──────────────────────────────
  async getMarketOverview() {
    return this.request<{
      indices: MarketQuote[];
      top_gainers: MarketQuote[];
      top_losers: MarketQuote[];
      market_status: string;
      timestamp: string;
    }>("/market/overview");
  }

  async getQuote(symbol: string) {
    return this.request<MarketQuote>(`/market/quote/${symbol}`);
  }

  async getMultipleQuotes(symbols: string[]) {
    return this.request<MarketQuote[]>(`/market/quotes?symbols=${symbols.join(",")}`);
  }

  async getChartData(symbol: string, interval = "1d", range = "6mo") {
    return this.request<{
      symbol: string;
      interval: string;
      range: string;
      currency: string;
      candles: ChartCandle[];
      total: number;
    }>(`/market/chart/${symbol}?interval=${interval}&range=${range}`);
  }

  async getSectorPerformance() {
    return this.request<SectorData[]>("/market/sectors");
  }

  async searchAssets(query: string, limit = 10) {
    return this.request<SearchResult[]>(`/market/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getPopularStocks() {
    return this.request<MarketQuote[]>("/market/popular");
  }

  // ── Watchlists ──────────────────────────────
  async listWatchlists() {
    return this.request<WatchlistResponse[]>("/watchlists");
  }

  async createWatchlist(name: string) {
    return this.request<WatchlistResponse>("/watchlists", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async updateWatchlist(watchlistId: string, name: string) {
    return this.request<WatchlistResponse>(`/watchlists/${watchlistId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  }

  async deleteWatchlist(watchlistId: string) {
    return this.request<void>(`/watchlists/${watchlistId}`, {
      method: "DELETE",
    });
  }

  async addWatchlistItem(watchlistId: string, symbol: string) {
    return this.request<{ symbol: string; id: string; message: string }>(
      `/watchlists/${watchlistId}/items`,
      {
        method: "POST",
        body: JSON.stringify({ symbol }),
      }
    );
  }

  async removeWatchlistItem(watchlistId: string, symbol: string) {
    return this.request<{ message: string }>(
      `/watchlists/${watchlistId}/items/${symbol}`,
      {
        method: "DELETE",
      }
    );
  }

  // ── Portfolios ──────────────────────────────
  async listPortfolios() {
    return this.request<PortfolioResponse[]>("/portfolios");
  }

  async createPortfolio(name: string) {
    return this.request<PortfolioResponse>("/portfolios", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async updatePortfolio(portfolioId: string, name: string) {
    return this.request<PortfolioResponse>(`/portfolios/${portfolioId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  }

  async deletePortfolio(portfolioId: string) {
    return this.request<void>(`/portfolios/${portfolioId}`, {
      method: "DELETE",
    });
  }

  async addHolding(
    portfolioId: string,
    symbol: string,
    quantity: number,
    avgBuyPrice: number,
    notes?: string
  ) {
    return this.request<{ symbol: string; id: string; message: string }>(
      `/portfolios/${portfolioId}/holdings`,
      {
        method: "POST",
        body: JSON.stringify({
          symbol,
          quantity,
          avg_buy_price: avgBuyPrice,
          notes,
        }),
      }
    );
  }

  async removeHolding(portfolioId: string, symbol: string) {
    return this.request<{ message: string }>(
      `/portfolios/${portfolioId}/holdings/${symbol}`,
      {
        method: "DELETE",
      }
    );
  }

  // ── Technical Scanner ───────────────────────
  async getMarketScan(refresh?: boolean) {
    return this.request<ScanResponse>(`/market/scan${refresh ? "?refresh=true" : ""}`);
  }


  // ── Predictions ─────────────────────────────
  async getPredictions(limit = 10) {

    return this.request<{
      predictions: PredictionData[];
      total: number;
      disclaimer: string;
    }>(`/predictions?limit=${limit}`);
  }

  async getPrediction(symbol: string) {
    return this.request<{
      prediction: PredictionData;
      disclaimer: string;
    }>(`/predictions/${symbol}`);
  }

  // ── News ────────────────────────────────────
  async getMarketNews(limit = 20) {
    return this.request<{
      articles: NewsArticle[];
      total: number;
      overall_sentiment: string;
      sentiment_score: number;
      timestamp: string;
    }>(`/news?limit=${limit}`);
  }

  async getSymbolNews(symbol: string, limit = 10) {
    return this.request<{
      symbol: string;
      articles: NewsArticle[];
      total: number;
      overall_sentiment: string;
      sentiment_score: number;
    }>(`/news/${symbol}?limit=${limit}`);
  }

  // ── AI Coach ────────────────────────────────
  async chatWithCoach(message: string, history: ChatHistoryMessage[] = []) {
    return this.request<{
      response: string;
      source: string;
      model: string;
    }>("/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    });
  }

  // ── Strategy Backtester ─────────────────────
  async runBacktest(payload: BacktestRequest) {
    return this.post<BacktestResponse>("/backtest/run", payload);
  }

  // ── Community ───────────────────────────────
  async getCommunityPosts() {
    return this.request<CommunityPostResponse[]>("/community");
  }

  async createCommunityPost(title: string, content: string, symbol?: string, backtestResult?: any) {
    return this.request<CommunityPostResponse>("/community", {
      method: "POST",
      body: JSON.stringify({ title, content, symbol, backtest_result: backtestResult }),
    });
  }

  // ── Alerts ──────────────────────────────────
  async getAlerts() {
    return this.request<AlertResponse[]>("/alerts");
  }

  async createAlert(symbol: string, alertType: string, targetValue?: number, patternName?: string) {
    return this.request<AlertResponse>("/alerts", {
      method: "POST",
      body: JSON.stringify({
        symbol,
        alert_type: alertType,
        target_value: targetValue,
        pattern_name: patternName,
      }),
    });
  }

  async deleteAlert(alertId: string) {
    return this.request<void>(`/alerts/${alertId}`, {
      method: "DELETE",
    });
  }

  async checkAlerts() {
    return this.request<CheckAlertsResponse>("/alerts/check", {
      method: "POST",
    });
  }

  // ── Stock Detail ────────────────────────────
  async getStockDetail(symbol: string) {
    return this.request<StockDetailResponse>(`/market/detail/${symbol}`);
  }

  async getStockChart(symbol: string, interval: string, range: string) {
    return this.request<{ candles: ChartCandle[] }>(`/market/chart/${symbol}?interval=${interval}&range=${range}`);
  }

  // ── Portfolio Analytics ─────────────────────
  async getPortfolioAnalytics(portfolioId: string) {
    return this.request<PortfolioAnalyticsResponse>(`/portfolios/${portfolioId}/analytics`);
  }

  // ── Notifications ───────────────────────────
  async getNotifications(limit = 30) {
    return this.request<NotificationSummaryResponse>(`/notifications?limit=${limit}`);
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>("/notifications/read", {
      method: "PUT",
    });
  }

  async markNotificationRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async clearNotifications() {
    return this.request<{ message: string }>("/notifications/clear", {
      method: "DELETE",
    });
  }

  // ── Generic ─────────────────────────────────

  get<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

