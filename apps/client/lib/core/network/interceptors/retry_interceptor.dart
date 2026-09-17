import 'package:dio/dio.dart';

/// Retries transient network failures (mirrors the backend's retry posture).
class RetryInterceptor extends Interceptor {
  RetryInterceptor(this._dio, {this.maxRetries = 2});
  final Dio _dio;
  final int maxRetries;

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final attempt = (err.requestOptions.extra['attempt'] as int?) ?? 0;
    final retriable = err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout;
    if (retriable && attempt < maxRetries) {
      final opts = err.requestOptions..extra['attempt'] = attempt + 1;
      await Future<void>.delayed(Duration(milliseconds: 300 * (attempt + 1)));
      try {
        final res = await _dio.fetch<dynamic>(opts);
        return handler.resolve(res);
      } catch (_) {/* fall through */}
    }
    handler.next(err);
  }
}
