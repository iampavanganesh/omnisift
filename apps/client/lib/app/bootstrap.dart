import 'package:flutter/widgets.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:hive_flutter/hive_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../features/notifications/application/local_notifications.dart';
import '../core/config/app_config.dart';
import '../core/network/session_manager.dart';
import '../firebase_options.dart';

/// Runs before the UI. Initializes platform services only — no business logic.
Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Print every Flutter framework error to the terminal (debug visibility).
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('❌ FLUTTER ERROR: ${details.exception}\n${details.stack}');
  };
  // Catch uncaught async errors too (network, futures, etc.).
  WidgetsBinding.instance.platformDispatcher.onError = (error, stack) {
    debugPrint('❌ UNCAUGHT ERROR: $error\n$stack');
    return true;
  };

  // Firebase — Core (needed by Analytics, Crashlytics, Performance, Messaging).
  // Wrapped so a config problem logs instead of crashing the whole app.
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    debugPrint('🔥 Firebase initialized');
    FirebaseMessaging.onBackgroundMessage(firebaseBgHandler);
    await LocalNotifications.init();
  } catch (e) {
    debugPrint('⚠️ Firebase init failed (continuing without it): $e');
  }

  await Hive.initFlutter();
  await Hive.openBox<dynamic>('recent_searches');
  await Hive.openBox<dynamic>('recently_viewed');
  await Hive.openBox<dynamic>('settings');
  await SessionManager.init(); // opens the session box for analytics visit-tagging
  await GoogleSignIn.instance.initialize(
    serverClientId: kIsWeb ? null : AppConfig.googleWebClientId,
  );
  if (AppConfig.supabaseUrl.isNotEmpty) {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnonKey,
    );
  }
}

/// Handles FCM messages when the app is in the background or terminated.
/// Must be a top-level function (Firebase requirement).
@pragma('vm:entry-point')
Future<void> firebaseBgHandler(RemoteMessage message) async {
  // Background/terminated notifications are drawn by the OS automatically from
  // the FCM `notification` payload — nothing extra needed here for display.
}