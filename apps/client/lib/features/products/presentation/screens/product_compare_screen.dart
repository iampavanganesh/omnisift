// C:\omnisift_final\apps\client\lib\features\products\presentation\screens\product_compare_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../features/auth/presentation/providers/auth_controller.dart';
import '../../../../features/auth/presentation/providers/auth_state.dart';
import '../../../../features/affiliate/presentation/providers/affiliate_providers.dart';
import '../../domain/entities/comparison.dart';
import '../../domain/entities/seller.dart';
import '../widgets/image_gallery.dart';
import '../providers/compare_by_product_provider.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Opened when a user taps a price-alert notification. Loads the current
/// comparison for a productId (cached if fresh, refreshed server-side if stale)
/// and shows the full product view: images, rating, price summary, sellers,
/// specs — plus a "last checked" line.
class ProductCompareScreen extends ConsumerWidget {
  const ProductCompareScreen({required this.productId, super.key});
  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(compareByProductProvider(productId));

    return Scaffold(
      appBar: AppBar(title: const Text('Price comparison')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Text('Could not load this product right now. Please try again.',
                textAlign: TextAlign.center, style: AppTypography.body),
          ),
        ),
        data: (res) {
          final c = res.comparison;
          if (c.sellers.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Text('No sellers available for this product right now.',
                    textAlign: TextAlign.center, style: AppTypography.body),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(compareByProductProvider(productId)),
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                  child: ImageGallery(images: c.images),
                ),
                _titleBlock(c),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
                  child: _freshnessLine(res.capturedAt, res.fresh),
                ),
                _lowestPrice(c),
                _priceSummary(c),
                _availableAt(context, ref, c),
                if (c.specifications.isNotEmpty) _specs(c),
                const SizedBox(height: AppSpacing.md),
              ],
            ),
          );
        },
      ),
    );
  }

  // --- sections (mirrors ProductDetailScreen) ---

  Widget _titleBlock(Comparison c) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(c.title, style: AppTypography.heading),
            if (c.rating != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                      color: AppColors.success, borderRadius: AppRadius.all(AppRadius.sm)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Text('${c.rating} ',
                        style: AppTypography.caption.copyWith(color: Colors.white)),
                    const Icon(Icons.star, size: 12, color: Colors.white),
                  ]),
                ),
                const SizedBox(width: AppSpacing.sm),
                if (c.reviewCount != null)
                  Text('(${c.reviewCount} reviews)', style: AppTypography.caption),
              ]),
            ],
          ],
        ),
      );

  Widget _freshnessLine(DateTime capturedAt, bool fresh) => Row(
        children: [
          Icon(Icons.schedule, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text('Prices last checked ${_timeAgo(capturedAt)}', style: AppTypography.caption),
        ],
      );

  ({double lowest, double highest, double average}) _summary(Comparison c) {
    final prices = c.sellers.map((s) => s.price).toList()..sort();
    final lowest = prices.first;
    final highest = prices.last;
    final average = prices.reduce((a, b) => a + b) / prices.length;
    return (lowest: lowest, highest: highest, average: average);
  }

  Widget _card(Widget child) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.all(AppRadius.lg),
            border: Border.all(color: AppColors.border),
          ),
          child: child,
        ),
      );

  Widget _lowestPrice(Comparison c) {
    final s = _summary(c);
    final pct = s.highest > 0 ? ((s.highest - s.lowest) / s.highest * 100).round() : 0;
    final goodDeal = pct >= 3;
    return _card(
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Lowest Price', style: AppTypography.caption),
              if (goodDeal)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12),
                      borderRadius: AppRadius.all(AppRadius.sm)),
                  child: Text('Good Deal',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.success, fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(_inr.format(s.lowest),
              style: AppTypography.display.copyWith(color: AppColors.primary)),
          if (pct > 0) ...[
            const SizedBox(height: 2),
            Text('You save ${_inr.format(s.highest - s.lowest)} ($pct%) vs highest',
                style: AppTypography.caption.copyWith(color: AppColors.success)),
          ],
        ],
      ),
    );
  }

  Widget _priceSummary(Comparison c) {
    final s = _summary(c);
    Widget cell(String label, double value, Color color) => Expanded(
          child: Column(children: [
            Text(label, style: AppTypography.caption),
            const SizedBox(height: 4),
            Text(_inr.format(value),
                style: AppTypography.body.copyWith(color: color, fontWeight: FontWeight.w700)),
          ]),
        );
    return _card(
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price Summary', style: AppTypography.title),
          const SizedBox(height: AppSpacing.md),
          Row(children: [
            cell('Highest', s.highest, AppColors.error),
            cell('Lowest', s.lowest, AppColors.success),
            cell('Average', s.average, AppColors.textPrimary),
          ]),
        ],
      ),
    );
  }

  Widget _availableAt(BuildContext context, WidgetRef ref, Comparison c) => _card(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Available at ${c.sellers.length} stores', style: AppTypography.title),
            const SizedBox(height: AppSpacing.sm),
            ...c.sellers.asMap().entries.map((e) => _sellerRow(ref, e.value, e.key == 0)),
          ],
        ),
      );

  // This screen is only ever opened with a real, known productId (see class
  // doc comment) — always go through the backend-controlled redirect, never
  // s.link directly, matching apps/web's trust model.
  Widget _sellerRow(WidgetRef ref, Seller s, bool cheapest) => InkWell(
        onTap: () async {
          final uri = Uri.parse(
            '${AppConfig.apiBaseUrl}/affiliate/go/product/$productId/platform/${Uri.encodeComponent(s.platform)}',
          );
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          if (ref.read(authControllerProvider).status == AuthStatus.authenticated) {
            unawaited(
              ref
                  .read(recordAffiliateClickProvider)(productId: productId, platform: s.platform)
                  .catchError((_) {}),
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Row(children: [
            Expanded(child: Text(s.platform, style: AppTypography.body)),
            if (cheapest)
              Container(
                margin: const EdgeInsets.only(right: AppSpacing.sm),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                    color: AppColors.success, borderRadius: BorderRadius.circular(4)),
                child: Text('Lowest',
                    style: AppTypography.caption.copyWith(color: Colors.white)),
              ),
            Text(_inr.format(s.price),
                style: AppTypography.title.copyWith(
                    color: cheapest ? AppColors.success : AppColors.textPrimary)),
            Icon(Icons.chevron_right, color: AppColors.textDisabled),
          ]),
        ),
      );

  Widget _specs(Comparison c) => _card(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Specifications', style: AppTypography.title),
            const SizedBox(height: AppSpacing.sm),
            ...c.specifications.map((sp) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SizedBox(width: 130, child: Text(sp.name, style: AppTypography.caption)),
                    Expanded(child: Text(sp.value, style: AppTypography.body)),
                  ]),
                )),
          ],
        ),
      );

  String _timeAgo(DateTime dt) {
    final d = DateTime.now().difference(dt);
    if (d.inMinutes < 1) return 'just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    if (d.inDays == 1) return 'yesterday';
    return '${d.inDays}d ago';
  }
}