import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../features/wishlist/presentation/providers/wishlist_controller.dart';

/// Navigator key for the Search branch (it has the nested product-detail route).
final searchBranchKey = GlobalKey<NavigatorState>();

/// The app shell: 5 bottom tabs. Back behaviour matches standard shopping apps:
/// detail → previous screen · non-Home tab → Home tab · Home → exit app.
class MainShell extends ConsumerWidget {
  const MainShell({required this.navigationShell, super.key});
  final StatefulNavigationShell navigationShell;

  void _onTap(WidgetRef ref, int index) {
    // Tapping the Wishlist tab (index 2) reloads it so current prices / drops
    // are fresh every time it's opened — no full app refresh needed.
    if (index == 2) {
      Future.microtask(() => ref.read(wishlistControllerProvider.notifier).load());
    }
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  void _handleBack() {
    final idx = navigationShell.currentIndex;
    // Search tab with a product-detail page open → close the detail first.
    if (idx == 1 && (searchBranchKey.currentState?.canPop() ?? false)) {
      searchBranchKey.currentState!.pop();
      return;
    }
    // On any non-Home tab → return to Home.
    if (idx != 0) {
      navigationShell.goBranch(0);
      return;
    }
    // Already on Home → leave the app.
    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        body: navigationShell,
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: AppColors.border, width: 0.5),
            ),
          ),
          child: NavigationBar(
            selectedIndex: navigationShell.currentIndex,
            onDestinationSelected: (index) => _onTap(ref, index),
            destinations: [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: 'Home',
              ),
              NavigationDestination(
                icon: Icon(Icons.search),
                selectedIcon: Icon(Icons.search),
                label: 'Search',
              ),
              NavigationDestination(
                icon: Icon(Icons.favorite_border),
                selectedIcon: Icon(Icons.favorite),
                label: 'Wishlist',
              ),
              NavigationDestination(
                icon: Icon(Icons.notifications_outlined),
                selectedIcon: Icon(Icons.notifications),
                label: 'Alerts',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
