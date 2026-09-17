// C:\omnisift_final\apps\client\lib\features\notifications\application\push_service.dart
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform, debugPrint;
import 'package:firebase_messaging/firebase_messaging.dart';
import '../infrastructure/datasources/device_token_api_datasource.dart';

/// Owns the device's FCM token lifecycle + notification-tap routing.
class PushService {
  PushService(this._datasource);
  final DeviceTokenApiDatasource _datasource;

  String? _lastToken;

  /// Set by the app once the router exists. Given a productId, it opens the
  /// compare screen. Kept as a callback so this service stays widget-free.
  void Function(String productId)? onOpenProduct;

  /// A tap that arrived before [onOpenProduct] was wired (cold start). Held
  /// here until the app is ready, then delivered exactly once.
  String? _pendingProductId;

  bool _tapWired = false;

  String get _platform {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.android:
        return 'android';
      default:
        return 'android';
    }
  }

  /// Call right after a successful login. Requests permission, gets the FCM
  /// token, registers it, and wires tap handling.
  Future<void> registerForUser() async {
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      _wireTapHandlers(messaging);

      if (kIsWeb) {
        debugPrint('ℹ️ Push: web token skipped (no VAPID key configured yet)');
        return;
      }

      final token = await messaging.getToken();
      if (token == null) {
        debugPrint('⚠️ Push: FCM token was null');
        return;
      }
      _lastToken = token;
      await _datasource.register(token, _platform);
      debugPrint('📲 Push: device token registered');

      messaging.onTokenRefresh.listen((newToken) async {
        _lastToken = newToken;
        try {
          await _datasource.register(newToken, _platform);
          debugPrint('📲 Push: device token refreshed');
        } catch (e) {
          debugPrint('⚠️ Push: refresh register failed: $e');
        }
      });
    } catch (e) {
      debugPrint('⚠️ Push: registerForUser failed: $e');
    }
  }

  /// Wire the tap entry points: app opened from terminated, from background,
  /// and (rare) a data message while foregrounded.
  void _wireTapHandlers(FirebaseMessaging messaging) {
    if (_tapWired) return;
    _tapWired = true;

    // App was terminated and launched by tapping the notification.
    messaging.getInitialMessage().then((msg) {
      if (msg != null) _handleTap(msg);
    });

    // App was in the background and brought to foreground by a tap.
    FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);
  }

  void _handleTap(RemoteMessage message) {
    final productId = message.data['productId'];
    if (productId is String && productId.isNotEmpty) {
      debugPrint('🔔 Push tapped → open product $productId');
      _pendingProductId = productId;
      _deliverPending();
    }
  }

  /// Fire the buffered tap if a handler is wired. Safe to call many times;
  /// clears the buffer so a tap is only ever delivered once.
  void _deliverPending() {
    final cb = onOpenProduct;
    final id = _pendingProductId;
    if (cb != null && id != null) {
      _pendingProductId = null;
      cb(id);
    }
  }

  /// Called by the app right after it sets [onOpenProduct], to flush a tap that
  /// arrived during bootstrap (cold start) before the handler existed.
  void flushPendingTap() => _deliverPending();

  /// Call on logout so this device stops receiving that user's pushes.
  Future<void> unregister() async {
    try {
      final token = _lastToken ?? (kIsWeb ? null : await FirebaseMessaging.instance.getToken());
      if (token != null) await _datasource.unregister(token);
      _lastToken = null;
      debugPrint('📴 Push: device token unregistered');
    } catch (e) {
      debugPrint('⚠️ Push: unregister failed: $e');
    }
  }
}