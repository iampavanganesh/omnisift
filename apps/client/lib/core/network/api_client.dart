import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/logging_interceptor.dart';
import 'interceptors/retry_interceptor.dart';
import 'interceptors/token_refresh_interceptor.dart';

/// The ONE Dio instance. All requests pass through it. Data sources depend on
/// this; widgets never do.
class ApiClient {
  ApiClient(SecureStorageService storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        contentType: 'application/json',
      ),
    );
    dio.interceptors.addAll([
      AuthInterceptor(storage),
      TokenRefreshInterceptor(storage, dio, () => onSessionExpired?.call()),
      RetryInterceptor(dio),
      LoggingInterceptor(),
    ]);
  }

  late final Dio dio;

  /// Called when a session can't be refreshed — the app wires this to logout.
  void Function()? onSessionExpired;
}
