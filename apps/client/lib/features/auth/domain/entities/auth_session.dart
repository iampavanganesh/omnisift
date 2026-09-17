/// A signed-in session. Pure domain — no Flutter, no Dio, no json.
class AuthSession {
  const AuthSession({
    required this.userId,
    required this.email,
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  final String userId;
  final String email;
  final String accessToken;
  final String refreshToken;
  final int expiresAt; // epoch seconds
}
