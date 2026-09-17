import 'package:dio/dio.dart';
import '../../storage/secure_storage_service.dart';

/// On a 401, silently refreshes the access token via /auth/refresh and retries
/// the original request once. If refresh fails, clears the session and signals
/// logout. Concurrent 401s share a single refresh call.
class TokenRefreshInterceptor extends Interceptor {
  TokenRefreshInterceptor(this._storage, this._dio, this._onSessionExpired);
  final SecureStorageService _storage;
  final Dio _dio;
  final void Function() _onSessionExpired;

  Future<String?>? _refreshing;

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final is401 = err.response?.statusCode == 401;
    final isAuthCall = err.requestOptions.path.contains('/auth/');
    final alreadyTried = err.requestOptions.extra['refreshed'] == true;

    if (!is401 || isAuthCall || alreadyTried) {
      return handler.next(err);
    }

    final newToken = await _refresh();
    if (newToken == null) {
      _onSessionExpired();
      return handler.next(err);
    }

    // Retry the original request with the fresh token.
    final opts = err.requestOptions;
    opts.extra['refreshed'] = true;
    opts.headers['Authorization'] = 'Bearer $newToken';
    try {
      final res = await _dio.fetch<dynamic>(opts);
      return handler.resolve(res);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }

  Future<String?> _refresh() {
    _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
    return _refreshing!;
  }

  Future<String?> _doRefresh() async {
    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null) {
      await _storage.clear();
      return null;
    }
    try {
      // Bare Dio (no interceptors) so the refresh call can't recurse.
      final bare = Dio(BaseOptions(baseUrl: _dio.options.baseUrl, contentType: 'application/json'));
      final res = await bare.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = res.data!['data'] as Map<String, dynamic>;
      final access = data['accessToken'] as String;
      await _storage.saveSession(
        accessToken: access,
        refreshToken: data['refreshToken'] as String?,
        userId: data['userId'] as String?,
      );
      return access;
    } catch (_) {
      await _storage.clear();
      return null;
    }
  }
}
