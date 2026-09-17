import 'package:dio/dio.dart';
import '../network/api_client.dart';

/// Reads DB-backed runtime config from the backend (GET /config), which the
/// backend serves from Supabase (app_config table). Distinct from AppConfig,
/// which is compile-time. Values here can change WITHOUT an app rebuild —
/// the app just re-reads them on next launch.
class RuntimeConfigDatasource {
  RuntimeConfigDatasource(this._client);
  final ApiClient _client;

  /// Auto-scroll page cap. Falls back to [fallback] on any failure so the app
  /// never breaks if /config is unreachable.
  Future<int> maxSearchPages({int fallback = 4}) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/config');
      final value = res.data?['maxApiCalls'];
      if (value is int && value >= 1) return value;
      if (value is num && value >= 1) return value.toInt();
      return fallback;
    } on DioException catch (_) {
      return fallback;
    } catch (_) {
      return fallback;
    }
  }

  /// Whether the price-history graph is enabled. Falls back to false so the
  /// graph stays hidden if /config is unreachable.
  Future<bool> priceGraphEnabled() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/config');
      return res.data?['priceGraphEnabled'] == true;
    } on DioException catch (_) {
      return false;
    } catch (_) {
      return false;
    }
  }
}