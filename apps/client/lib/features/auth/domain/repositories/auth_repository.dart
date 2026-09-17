import '../entities/auth_session.dart';

/// The auth port. Infrastructure supplies the API-backed implementation.
/// Methods throw a [Failure] (see core/errors) on failure.
abstract interface class AuthRepository {
  Future<AuthSession> login({required String email, required String password});
  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String password,
  });
  Future<void> logout();
  Future<void> forgotPassword(String email);

  /// Native Google sign-in → Omnisift session. Returns null if the user cancels.
  Future<AuthSession?> googleSignIn();

  /// Returns a stored session if the user is already signed in, else null.
  Future<AuthSession?> currentSession();
}