import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../features/auth/presentation/providers/auth_controller.dart';
import '../../../../features/auth/presentation/providers/auth_state.dart';
import '../providers/profile_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You will need to sign in again to use Omnisift.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed ?? false) {
      await ref.read(authControllerProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(authControllerProvider.select((s) => s.status));

    // GUEST: don't try to load a profile (there's no logged-in user, so the
    // fetch would spin forever). Show a login prompt instead.
    if (status != AuthStatus.authenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Profile'),
          actions: [
            IconButton(icon: const Icon(Icons.settings_outlined), tooltip: 'Settings', onPressed: () => context.push('/settings')),
          ],
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.account_circle_outlined, size: 72, color: AppColors.textDisabled),
                const SizedBox(height: AppSpacing.md),
                Text('You\'re browsing as a guest',
                    style: AppTypography.title, textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.xs),
                Text('Log in to save products and set price alerts.',
                    style: AppTypography.body, textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => context.push('/login'),
                    child: const Text('Login / Sign up'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final async = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(icon: const Icon(Icons.settings_outlined), tooltip: 'Settings', onPressed: () => context.push('/settings')),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text("Couldn't load your profile.", style: AppTypography.body),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton(
                  onPressed: () => ref.invalidate(profileProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (p) => ListView(
          children: [
            const SizedBox(height: AppSpacing.xl),
            Center(
              child: CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.primary,
                child: Icon(Icons.person, size: 44, color: Colors.white),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Center(
              child: Text(
                (p.fullName?.isNotEmpty ?? false) ? p.fullName! : 'Add your name',
                style: AppTypography.title,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Center(child: Text(p.email, style: AppTypography.caption)),
            const SizedBox(height: AppSpacing.lg),
            const Divider(),
            _menuTile(context, Icons.storefront_outlined, 'Click History',
                onTap: () => context.push('/click-history')),
            _menuTile(context, Icons.notifications_active_outlined, 'Price Alerts',
                onTap: () => context.go('/alerts')),
            _menuTile(context, Icons.favorite_border, 'Wishlist',
                onTap: () => context.go('/wishlist')),
            _menuTile(context, Icons.history, 'Recently Viewed',
                onTap: () => context.push('/recently-viewed')),
            _menuTile(context, Icons.badge_outlined, 'Account Details',
                onTap: () => context.push('/account-details')),
            _menuTile(context, Icons.help_outline, 'Help & Support',
                onTap: () => context.push('/help-support')),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.error),
              title: Text('Log out', style: AppTypography.body.copyWith(color: AppColors.error)),
              onTap: () => _confirmLogout(context, ref),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }

  Widget _menuTile(BuildContext context, IconData icon, String title, {required VoidCallback onTap}) =>
      ListTile(
        leading: Icon(icon, color: AppColors.textSecondary),
        title: Text(title, style: AppTypography.body),
        trailing: Icon(Icons.chevron_right, color: AppColors.textDisabled),
        onTap: onTap,
      );
}
