import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client_provider.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/presentation/providers/auth_controller.dart';
import '../features/auth/presentation/providers/auth_state.dart';
import '../features/notifications/application/local_notifications.dart';
import '../features/notifications/presentation/providers/push_providers.dart';
import '../features/notifications/presentation/providers/notifications_providers.dart';
import 'router.dart';

class OmnisiftApp extends ConsumerStatefulWidget {
  const OmnisiftApp({super.key});
  @override
  ConsumerState<OmnisiftApp> createState() => _OmnisiftAppState();
}

class _OmnisiftAppState extends ConsumerState<OmnisiftApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ref.read(apiClientProvider).onSessionExpired = () {
      ref.read(authControllerProvider.notifier).logout();
    };

    // Notification tap → open the compare screen for that product.
    // Both notification sources route through the SAME handler:
    //  - FCM-drawn banners (app in background/killed) via PushService
    //  - app-drawn local banners (app in foreground) via LocalNotifications
    final push = ref.read(pushServiceProvider);
    push.onOpenProduct = _openCompare;
    push.flushPendingTap();

    LocalNotifications.onOpenProduct = _openCompare;
    LocalNotifications.flushPendingTap();

    // A push received while the app is foregrounded only draws a banner —
    // without this the bell badge and notifications list stay stale until a
    // manual pull-to-refresh or a full app restart.
    LocalNotifications.onNotificationReceived = _refreshNotifications;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Most alerts fire while the app is backgrounded/killed — the user only
    // sees the OS notification tray, then reopens the app. Refresh here so
    // the bell badge reflects it immediately instead of requiring a cold
    // restart (Home's own load-on-init only ever runs once per session).
    if (state == AppLifecycleState.resumed) _refreshNotifications();
  }

  void _refreshNotifications() {
    if (ref.read(authControllerProvider).status != AuthStatus.authenticated) return;
    ref.read(notificationsControllerProvider.notifier).load();
  }

  /// Navigate to the compare screen — but only after auth has resolved (we're
  /// past the splash → home redirect) and one frame has passed. Pushing during
  /// that redirect on cold start gets clobbered, which is why the seller list
  /// never mounted.
  void _openCompare(String productId) {
    void go() {
      if (!mounted) return;
      final status = ref.read(authControllerProvider).status;
      if (status == AuthStatus.unknown) {
        // Still on the splash resolving auth — wait one more frame.
        WidgetsBinding.instance.addPostFrameCallback((_) => go());
        return;
      }
      ref.read(routerProvider).push('/compare-product', extra: productId);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) => go());
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(authControllerProvider.select((s) => s.status));
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'OmniSift',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}