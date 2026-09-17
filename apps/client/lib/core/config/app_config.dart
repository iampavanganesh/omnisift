/// Compile-time configuration. Pass via --dart-define so no secrets are baked
/// into source. One place for base URLs + Supabase keys.
class AppConfig {
  const AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1', // Android emulator → host
  );

  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// Google Web Client ID (public value; used as serverClientId for native sign-in).
  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '944886301743-quj9f8v3j6sgsrq5g2f2lsvp7qn474ck.apps.googleusercontent.com',
  );



  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);
}
