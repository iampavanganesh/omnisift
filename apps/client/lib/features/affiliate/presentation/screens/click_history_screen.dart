import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/loaders/skeleton_loader.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../domain/entities/affiliate_click.dart';
import '../providers/click_history_controller.dart';

class ClickHistoryScreen extends ConsumerStatefulWidget {
  const ClickHistoryScreen({super.key});
  @override
  ConsumerState<ClickHistoryScreen> createState() => _ClickHistoryScreenState();
}

class _ClickHistoryScreenState extends ConsumerState<ClickHistoryScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      ref.read(clickHistoryControllerProvider.notifier).loadMore();
    }
  }

  Future<void> _open(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(clickHistoryControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Click History')),
      body: _body(state),
    );
  }

  Widget _body(ClickHistoryState state) {
    switch (state.status) {
      case ClickHistoryStatus.loading:
        return ListView.builder(
          padding: const EdgeInsets.all(AppSpacing.lg),
          itemCount: 5,
          itemBuilder: (_, __) => const SkeletonListCard(),
        );
      case ClickHistoryStatus.error:
        return EmptyState(
          icon: Icons.error_outline,
          title: "Couldn't load your click history",
          subtitle: 'Check your connection and try again.',
          onAction: () => ref.read(clickHistoryControllerProvider.notifier).load(),
        );
      case ClickHistoryStatus.empty:
        return const EmptyState(
          icon: Icons.storefront_outlined,
          title: 'No store visits yet',
          subtitle: 'Tap a store on any product to see it here.',
        );
      case ClickHistoryStatus.success:
        final itemCount = state.items.length + (state.isLoadingMore ? 1 : 0);
        return ListView.builder(
          controller: _scroll,
          padding: const EdgeInsets.all(AppSpacing.lg),
          itemCount: itemCount,
          itemBuilder: (_, i) {
            if (i >= state.items.length) {
              return const Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            return _tile(state.items[i]);
          },
        );
    }
  }

  Widget _tile(AffiliateClick c) => Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.all(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: InkWell(
          onTap: () => _open(c.targetUrl),
          borderRadius: AppRadius.all(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: AppRadius.all(AppRadius.md),
                  child: Container(
                    color: AppColors.background,
                    width: 56,
                    height: 56,
                    padding: const EdgeInsets.all(4),
                    child: c.productImageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: c.productImageUrl!,
                            fit: BoxFit.contain,
                            errorWidget: (_, __, ___) =>
                                Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                          )
                        : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.productTitle,
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.body),
                      const SizedBox(height: 2),
                      Text('${c.sellerName} · ${_relativeTime(c.clickedAt)}',
                          style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Icon(Icons.open_in_new, size: 18, color: AppColors.textDisabled),
              ],
            ),
          ),
        ),
      );

  String _relativeTime(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat.yMMMd().format(t);
  }
}
