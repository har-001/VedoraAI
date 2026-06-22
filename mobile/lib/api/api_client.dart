import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = "http://10.0.2.2:8000/api/v1"; // 10.0.2.2 points to localhost in Android Emulator
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('access_token');
        if (token != null) {
          options.headers["Authorization"] = "Bearer $token";
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        // Handle global API errors (e.g. 401 unauth)
        return handler.next(e);
      },
    ));
  }

  // ── Authentication ───────────────────────────
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await _dio.post("/auth/login", data: {
        "username": email, // OAuth standard fields
        "password": password,
      });
      if (response.statusCode == 200) {
        final data = response.data;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', data['access_token']);
        await prefs.setString('refresh_token', data['refresh_token']);
        await prefs.setString('user_name', data['user']['full_name']);
        await prefs.setString('user_role', data['user']['role']);
        return data;
      }
    } catch (e) {
      rethrow;
    }
    return null;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_name');
    await prefs.remove('user_role');
  }

  // ── Market Data ──────────────────────────────
  Future<List<dynamic>> getMarketOverview() async {
    try {
      final response = await _dio.get("/market/overview");
      if (response.statusCode == 200) {
        return response.data["top_gainers"] ?? [];
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>?> getStockDetail(String symbol) async {
    try {
      final response = await _dio.get("/market/detail/$symbol");
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (_) {}
    return null;
  }

  // ── Predictions & AI Coach ───────────────────
  Future<List<dynamic>> getPredictions() async {
    try {
      final response = await _dio.get("/predictions");
      if (response.statusCode == 200) {
        return response.data ?? [];
      }
    } catch (_) {}
    return [];
  }

  Future<String> askCoach(String message, List<Map<String, String>> history) async {
    try {
      final response = await _dio.post("/coach/chat", data: {
        "message": message,
        "history": history,
      });
      if (response.statusCode == 200) {
        return response.data["response"] ?? "No response received";
      }
    } catch (_) {}
    return "Error communicating with AI Coach.";
  }
}

final api = ApiClient();
