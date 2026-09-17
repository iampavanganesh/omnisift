// C:\omnisift_final\apps\client\lib\features\notifications\application\local_notifications.dart
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Draws real Android notification banners for incoming FCM messages.
///
/// FCM only auto-shows a banner when the app is in the BACKGROUND. When the app
/// is in the FOREGROUND, Android suppresses it — so we draw it ourselves here
/// via flutter_local_notifications. These self-drawn banners now also carry the
/// productId and route to the compare screen on tap, exactly like the FCM ones.
class LocalNotifications {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'omnisift_alerts',
    'Price alerts',
    description: 'Price drop alerts and updates',
    importance: Importance.high,
  );

  static bool _ready = false;

  /// Set by the app: given a productId, open the compare screen. Same handler
  /// the FCM push routing uses, so foreground-drawn banners route identically.
  static void Function(String productId)? onOpenProduct;

  /// Set by the app: called whenever a push arrives while the app is
  /// foregrounded, so the in-app notifications list/badge refreshes instead of
  /// staying stale until the user manually pulls-to-refresh or restarts.
  static void Function()? onNotificationReceived;

  /// A tap captured before [onOpenProduct] was wired (cold launch). Held here
  /// until the app is ready, then delivered once.
  static String? _pendingProductId;

  /// Call once at startup. Creates the Android channel, wires tap handling, and
  /// listens for foreground FCM messages.
  static Future<void> init() async {
    if (kIsWeb || _ready) return;
    _ready = true;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onTap,
    );

    final androidImpl =
        _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidImpl?.createNotificationChannel(_channel);

    // App launched by tapping one of OUR banners while it was terminated.
    final launch = await _plugin.getNotificationAppLaunchDetails();
    if (launch?.didNotificationLaunchApp ?? false) {
      final pid = launch?.notificationResponse?.payload;
      if (pid != null && pid.isNotEmpty) _pendingProductId = pid;
    }

    // Foreground messages → draw a banner ourselves (carry productId as payload).
    FirebaseMessaging.onMessage.listen(_showFromMessage);
    debugPrint('🔔 LocalNotifications ready');
  }

  static void _onTap(NotificationResponse response) {
    final pid = response.payload;
    if (pid != null && pid.isNotEmpty) {
      debugPrint('🔔 Local notif tapped → open product $pid');
      _pendingProductId = pid;
      _deliverPending();
    }
  }

  static void _deliverPending() {
    final cb = onOpenProduct;
    final id = _pendingProductId;
    if (cb != null && id != null) {
      _pendingProductId = null;
      cb(id);
    }
  }

  /// Called by the app once onOpenProduct is set, to flush a cold-launch tap.
  static void flushPendingTap() => _deliverPending();

  static Future<void> _showFromMessage(RemoteMessage message) async {
    final n = message.notification;
    final title = n?.title ?? message.data['title'] as String? ?? 'Omnisift';
    final body = n?.body ?? message.data['body'] as String? ?? '';
    final productId = message.data['productId'] as String?;
    await _show(title, body, productId);
    onNotificationReceived?.call();
  }

  static Future<void> _show(String title, String body, String? payload) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'omnisift_alerts',
        'Price alerts',
        channelDescription: 'Price drop alerts and updates',
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
      ),
    );
    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }
}