import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../deals/domain/entities/deal.dart';
import '../../../deals/presentation/deals_providers.dart';
import '../../../products/presentation/screens/product_detail_screen.dart';
import 'section_header.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Home screen's "Top Deals for You" + price-drops section — real data (see
/// backend `deals` module). Sparse on a fresh install, grows as products are
/// viewed. Renders nothing while loading/errored/empty, same as before this
/// was extracted out of HomeScreen.build().
class DealsSection extends ConsumerWidget {
  const DealsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dealsProvider(20));
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (deals) {
        if (deals.isEmpty) return const SizedBox.shrink();
        final topDeals = deals.take(10).toList();
        final priceDrops = deals.skip(10).toList();
        return Column(
          children: [
            const SizedBox(height: AppSpacing.lg),
            const SectionHeader('Top Deals for You'),
            _dealsRow(context, topDeals),
            if (priceDrops.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.lg),
              _priceDropsBanner(context, priceDrops),
              const SizedBox(height: AppSpacing.sm),
              _dealsRow(context, priceDrops),
            ],
          ],
        );
      },
    );
  }

  Widget _dealsRow(BuildContext context, List<Deal> deals) => SizedBox(
        height: 172,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          itemCount: deals.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
          itemBuilder: (_, i) => _dealTile(context, deals[i]),
        ),
      );

  // Deals are sourced from live catalog prices, so — like any other catalog
  // product — tapping opens our own Product Detail (tokenless path), never
  // the raw store URL directly.
  Widget _dealTile(BuildContext context, Deal d) => GestureDetector(
        onTap: () => context.push(
          '/product',
          extra: ProductDetailScreen.fromCatalog(
            productId: d.productId,
            title: d.title,
            imageUrl: d.imageUrl,
          ).product,
        ),
        child: Container(
          width: 132,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.all(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(children: [
                ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(AppRadius.md)),
                  child: Container(
                    width: 132, height: 96,
                    color: AppColors.background,
                    padding: const EdgeInsets.all(AppSpacing.xs),
                    child: d.imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: d.imageUrl!,
                            fit: BoxFit.contain,
                            errorWidget: (_, __, ___) => Icon(Icons.image_not_supported_outlined,
                                color: AppColors.textDisabled),
                          )
                        : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                  ),
                ),
                Positioned(
                  left: 4, top: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                        color: AppColors.success, borderRadius: BorderRadius.circular(4)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.arrow_downward, size: 9, color: Colors.white),
                      Text(' ${d.discountPct}%',
                          style: AppTypography.caption.copyWith(color: Colors.white, fontSize: 10)),
                    ]),
                  ),
                ),
              ]),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xs),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(d.title,
                        style: AppTypography.caption, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(_inr.format(d.price),
                        style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

  Widget _priceDropsBanner(BuildContext context, List<Deal> priceDrops) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.10),
            borderRadius: AppRadius.all(AppRadius.md),
          ),
          child: Row(children: [
            Icon(Icons.verified, color: AppColors.success, size: 20),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              // "discounts", not "price drops": these come from /deals, ranked
              // by the seller's advertised discount off list price — NOT an
              // observed drop from a price OmniSift recorded earlier. Price
              // ALERTS are the real observed-drop feature; keeping the two
              // worded distinctly so users don't read them as the same signal.
              child: Text('We found ${priceDrops.length} more discounted products',
                  style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
            ),
            TextButton(
              onPressed: () => _showAllPriceDrops(context, priceDrops),
              style: TextButton.styleFrom(foregroundColor: AppColors.success),
              child: const Text('View All'),
            ),
          ]),
        ),
      );

  void _showAllPriceDrops(BuildContext context, List<Deal> priceDrops) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('More Discounts You Might Like', style: AppTypography.title),
              const SizedBox(height: AppSpacing.md),
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: priceDrops.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (_, i) {
                    final d = priceDrops[i];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: ClipRRect(
                        borderRadius: AppRadius.all(AppRadius.sm),
                        child: Container(
                          width: 48, height: 48,
                          color: AppColors.background,
                          child: d.imageUrl != null
                              ? CachedNetworkImage(imageUrl: d.imageUrl!, fit: BoxFit.contain)
                              : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                        ),
                      ),
                      title: Text(d.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Text('${d.platform} · ↓${d.discountPct}%'),
                      trailing: Text(_inr.format(d.price),
                          style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                      onTap: () {
                        Navigator.of(context).pop(); // close the sheet first
                        context.push(
                          '/product',
                          extra: ProductDetailScreen.fromCatalog(
                            productId: d.productId,
                            title: d.title,
                            imageUrl: d.imageUrl,
                          ).product,
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
