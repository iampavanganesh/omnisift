import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_api_datasource.dart';
import '../datasources/google_auth_datasource.dart';
import '../mappers/auth_mapper.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._api, this._google, this._storage);
  final AuthApiDatasource _api;
  final GoogleAuthDatasource _google;
  final SecureStorageService _storage;

  @override
  Future<AuthSession> login({required String email, required String password}) async {
    final session = sessionDtoToEntity(await _api.login(email, password));
    await _persist(session);
    return session;
  }

  @override
  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final session = sessionDtoToEntity(await _api.register(fullName, email, password));
    await _persist(session);
    return session;
  }

  @override
  Future<AuthSession?> googleSignIn() async {
    final idToken = await _google.getIdToken();
    if (idToken == null) return null; // user cancelled
    final session = sessionDtoToEntity(await _api.googleSignIn(idToken));
    await _persist(session);
    return session;
  }

  @override
  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {
      // best-effort; clear the local session regardless
    }
    await _storage.clear();
  }

  @override
  Future<void> forgotPassword(String email) => _api.forgotPassword(email);

  @override
  Future<AuthSession?> currentSession() async {
    final token = await _storage.readAccessToken();
    if (token == null) return null;
    return AuthSession(
      userId: '',
      email: '',
      accessToken: token,
      refreshToken: '',
      expiresAt: 0,
    );
  }

  Future<void> _persist(AuthSession s) => _storage.saveSession(
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        userId: s.userId,
      );
}