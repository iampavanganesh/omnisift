import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

/// Tokens live ONLY in secure storage — never SharedPreferences (PRD rule).
class SecureStorageService {
  SecureStorageService([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();
  final FlutterSecureStorage _storage;

  Future<void> saveSession({required String accessToken, String? refreshToken, String? userId}) async {
    await _storage.write(key: AppConstants.tokenKey, value: accessToken);
    if (refreshToken != null) await _storage.write(key: AppConstants.refreshKey, value: refreshToken);
    if (userId != null) await _storage.write(key: AppConstants.userIdKey, value: userId);
  }

  Future<String?> readAccessToken() => _storage.read(key: AppConstants.tokenKey);

  Future<String?> readRefreshToken() => _storage.read(key: AppConstants.refreshKey);

  Future<void> clear() => _storage.deleteAll();
}
