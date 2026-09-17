import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/affiliate/presentation/screens/click_history_screen.dart';
import '../features/alerts/presentation/screens/alerts_screen.dart';
import '../features/alerts/presentation/screens/create_alert_screen.dart';
import '../features/auth/presentation/providers/auth_controller.dart';
import '../features/auth/presentation/providers/auth_state.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/auth/presentation/screens/splash_screen.dart';
import '../features/auth/presentation/screens/welcome_screen.dart';
import '../features/catalog/domain/entities/brand.dart';
import '../features/catalog/domain/entities/category.dart';
import '../features/catalog/presentation/screens/all_brands_screen.dart';
import '../features/catalog/presentation/screens/all_categories_screen.dart';
import '../features/catalog/presentation/screens/brand_page_screen.dart';
import '../features/catalog/presentation/screens/category_listing_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/notifications/presentation/screens/notifications_screen.dart';
import '../features/products/presentation/screens/price_graph_screen.dart';
import '../features/products/presentation/screens/product_detail_screen.dart';
import '../features/products/presentation/screens/product_compare_screen.dart';
import '../features/products/presentation/screens/recently_viewed_screen.dart';
import '../features/profile/presentation/screens/account_details_screen.dart';
import '../features/profile/presentation/screens/help_support_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/settings/presentation/screens/settings_screen.dart';
import '../features/search/domain/entities/product.dart';
import '../features/search/presentation/screens/search_screen.dart';
import '../features/shell/presentation/main_shell.dart';
import '../features/wishlist/presentation/providers/pending_wishlist_add_provider.dart';
import '../features/wishlist/presentation/screens/wishlist_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();

/// Central navigation. Auth redirect + a 5-tab bottom-nav shell. Product detail
/// is nested under the Search tab, so back returns to the search results.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<AuthStatus>(AuthStatus.unknown);
  ref.listen(
    authControllerProvider.select((s) => s.status),
    (_, next) => refresh.value = next,
    fireImmediately: true,
  );
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(authControllerProvider).status;
      final loc = state.matchedLocation;
      const authRoutes = {'/welcome', '/login', '/register', '/forgot-password'};

      // Still figuring out auth state → sit on splash.
      if (status == AuthStatus.unknown) return loc == '/' ? null : '/';

      // GUESTS ARE ALLOWED. Unauthenticated users can browse the whole app
      // (search/compare/etc.). Login is requested later, at the point they try
      // to SAVE something (wishlist / price alert) — handled in those screens.
      if (status == AuthStatus.unauthenticated) {
        return loc == '/' ? '/home' : null;
      }

      // Logged in: keep them out of the splash/auth screens. If they got here
      // via a /wishlist?add=<id> deep link that sent a guest to sign in first
      // (see WishlistScreen), resume that instead of landing on plain /home —
      // covers both Google sign-in (redirect-driven, no explicit navigation of
      // its own) and email/password (whose extra explicit context.go('/home')
      // is itself overridden in login_screen.dart's _submit for the same reason).
      if (loc == '/' || authRoutes.contains(loc)) {
        final pendingAdd = ref.read(pendingWishlistAddProvider);
        if (pendingAdd != null) {
          ref.read(pendingWishlistAddProvider.notifier).set(null);
          return '/wishlist?add=$pendingAdd';
        }
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/product',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => ProductDetailScreen(product: state.extra! as Product),
      ),
      GoRoute(
        path: '/settings',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/notifications',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/compare-product',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => ProductCompareScreen(productId: state.extra! as String),
      ),
      // URL-addressable variant of /compare-product for links that can't pass
      // `extra` (e.g. outbound links from the web app). Reads the product id
      // from the query string instead.
      GoRoute(
        path: '/compare',
        parentNavigatorKey: _rootKey,
        redirect: (_, state) {
          final productId = state.uri.queryParameters['product'];
          return productId == null ? '/home' : null;
        },
        builder: (_, state) {
          return ProductCompareScreen(productId: state.uri.queryParameters['product']!);
        },
      ),
      GoRoute(
        path: '/categories',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const AllCategoriesScreen(),
      ),
      GoRoute(
        path: '/category',
        parentNavigatorKey: _rootKey,
        builder: (_, state) {
          final extra = state.extra! as ({Category category, String? chip});
          return CategoryListingScreen(category: extra.category, initialChip: extra.chip);
        },
      ),
      GoRoute(
        path: '/brands',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const AllBrandsScreen(),
      ),
      GoRoute(
        path: '/brand',
        parentNavigatorKey: _rootKey,
        builder: (_, state) {
          final extra = state.extra! as ({Brand brand, Category? category});
          return BrandPageScreen(brand: extra.brand, category: extra.category);
        },
      ),
      GoRoute(
        path: '/recently-viewed',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const RecentlyViewedScreen(),
      ),
      GoRoute(
        path: '/price-graph',
        parentNavigatorKey: _rootKey,
        builder: (_, state) {
          final extra = state.extra! as ({String productId, String title});
          return PriceGraphScreen(productId: extra.productId, title: extra.title);
        },
      ),
      GoRoute(
        path: '/create-alert',
        parentNavigatorKey: _rootKey,
        builder: (_, state) {
          final extra = state.extra! as ({
            String productId,
            String productTitle,
            String? productImageUrl,
            double currentPrice,
          });
          return CreateAlertScreen(
            productId: extra.productId,
            productTitle: extra.productTitle,
            productImageUrl: extra.productImageUrl,
            currentPrice: extra.currentPrice,
          );
        },
      ),
      GoRoute(
        path: '/click-history',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const ClickHistoryScreen(),
      ),
      GoRoute(
        path: '/account-details',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const AccountDetailsScreen(),
      ),
      GoRoute(
        path: '/help-support',
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const HelpSupportScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          ]),
          StatefulShellBranch(
            navigatorKey: searchBranchKey,
            routes: [
              GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
            ],
          ),
          StatefulShellBranch(routes: [
            GoRoute(path: '/wishlist', builder: (_, __) => const WishlistScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/alerts', builder: (_, __) => const AlertsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
  );
});