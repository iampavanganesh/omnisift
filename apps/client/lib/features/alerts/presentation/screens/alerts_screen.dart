import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/loaders/skeleton_loader.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../auth/presentation/providers/auth_controller.dart';
import '../../../auth/presentation/providers/auth_state.dart';
import '../../infrastructure/datasources/alerts_api_datasource.dart';
import '../providers/alerts_providers.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class AlertsScreen extends ConsumerStatefulWidget {
  const AlertsScreen({super.key});

  @override
  ConsumerState<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends ConsumerState<AlertsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authControllerProvider).status == AuthStatus.authenticated) {
        ref.read(alertsControllerProvider.notifier).load();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final loggedIn =
        ref.watch(authControllerProvider.select((s) => s.status)) == AuthStatus.authenticated;
    final state = ref.watch(alertsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Price alerts')),
      body: !loggedIn
          ? _loginPrompt()
          : RefreshIndicator(
              onRefresh: () => ref.read(alertsControllerProvider.notifier).load(),
              child: state.loading && state.items.isEmpty
                  ? ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                      itemCount: 6,
                      separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.border),
                      itemBuilder: (_, __) => const SkeletonListTile(),
                    )
                  : state.items.isEmpty
                      ? _empty()
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                          itemCount: state.items.length,
                          separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.border),
                          itemBuilder: (_, i) => _tile(state.items[i]),
                        ),
            ),
    );
  }

  Widget _tile(AlertDto a) {
    final subtitle = a.type == 'BELOW_TARGET' && a.targetPrice != null
        ? 'Notify below ${_inr.format(a.targetPrice)}'
        : 'Notify on any price drop';
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
        child: Icon(
          a.isActive ? Icons.notifications_active : Icons.notifications_off,
          color: a.isActive ? AppColors.primary : AppColors.textDisabled,
          size: 20,
        ),
      ),
      title: Text(
        a.productTitle ?? 'Product',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
      ),
      subtitle: Text(subtitle, style: AppTypography.caption),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Pause / resume
          Switch(
            value: a.isActive,
            onChanged: (v) => _toggle(a.id, v),
          ),
          // Delete
          IconButton(
            icon: Icon(Icons.delete_outline, color: AppColors.textSecondary),
            tooltip: 'Remove alert',
            onPressed: () => _confirmDelete(a),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(AlertDto a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Remove alert?'),
        content: Text('Stop watching "${a.productTitle ?? 'this product'}"?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Remove')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(alertsControllerProvider.notifier).delete(a.id);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(
          content: Text("Couldn't remove this alert. Try again."),
          behavior: SnackBarBehavior.floating,
        ));
    }
  }

  Future<void> _toggle(String id, bool value) async {
    try {
      await ref.read(alertsControllerProvider.notifier).toggle(id, value);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(
          content: Text("Couldn't update this alert. Try again."),
          behavior: SnackBarBehavior.floating,
        ));
    }
  }

  Widget _empty() => const EmptyState(
        icon: Icons.notifications_none,
        title: 'No alerts yet',
        subtitle: 'Open a product and tap "Set Alert" — we\'ll watch the price and notify you when it drops.',
      );

  Widget _loginPrompt() => const EmptyState(
        icon: Icons.lock_outline,
        title: 'Sign in required',
        subtitle: 'Log in to see your price alerts.',
      );
}