// C:\omnisift_final\apps\client\lib\features\notifications\presentation\screens\notifications_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/loaders/skeleton_loader.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../providers/notifications_providers.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    // Load fresh when the screen opens.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationsControllerProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsControllerProvider);
    final items = state.items;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (state.unread > 0)
            TextButton(
              onPressed: () => ref.read(notificationsControllerProvider.notifier).markAllRead(),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(notificationsControllerProvider.notifier).load(),
        child: state.loading && items.isEmpty
            ? ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                itemCount: 6,
                separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.border),
                itemBuilder: (_, __) => const SkeletonListTile(),
              )
            : items.isEmpty
                ? _empty()
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.border),
                    itemBuilder: (_, i) => _tile(items[i]),
                  ),
      ),
    );
  }

  (IconData, Color) _styleFor(String type) => switch (type) {
        'PRICE_DROP' => (Icons.trending_down, AppColors.secondary),
        'ALERT_TRIGGERED' => (Icons.notifications_active, AppColors.warning),
        _ => (Icons.campaign_outlined, AppColors.primary),
      };

  Widget _tile(NotificationItem n) {
    final (icon, color) = _styleFor(n.type);
    return ListTile(
        isThreeLine: true,
        onTap: n.isRead
            ? null
            : () => ref.read(notificationsControllerProvider.notifier).markRead(n.id),
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.12),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(
          n.title,
          style: AppTypography.body.copyWith(
            fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w700,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(n.body, style: AppTypography.caption),
            const SizedBox(height: 2),
            Text(_timeAgo(n.createdAt), style: AppTypography.caption.copyWith(color: AppColors.textDisabled)),
          ],
        ),
        trailing: n.isRead
            ? null
            // The dot alone conveys "unread" by color/shape only — give it a
            // real label so screen reader users get the same information.
            : Semantics(
                label: 'Unread',
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                ),
              ),
      );
  }

  /// [createdAt] arrives from the backend as a UTC ISO timestamp — convert to
  /// local before comparing against "now" so the label matches the device's
  /// clock instead of drifting by the UTC offset.
  String _timeAgo(DateTime createdAt) {
    final local = createdAt.toLocal();
    final diff = DateTime.now().difference(local);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('d MMM, h:mm a').format(local);
  }

  Widget _empty() => const EmptyState(
        icon: Icons.notifications_none,
        title: 'No notifications yet',
        subtitle: 'Set a price alert on a product — we\'ll notify you here when it drops.',
      );
}
