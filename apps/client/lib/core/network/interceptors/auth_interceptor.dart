import 'package:dio/dio.dart';
import '../../storage/secure_storage_service.dart';
import '../session_manager.dart';

/// Attaches the Supabase access token + the anonymous session id to every request.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._storage);
  final SecureStorageService _storage;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.readAccessToken();
    if (token != null) options.headers['Authorization'] = 'Bearer $token';

    // Anonymous visit tag for analytics (guest-friendly, not a user id).
    final sid = SessionManager.current;
    if (sid.isNotEmpty) options.headers['x-session-id'] = sid;

    handler.next(options);
  }
}