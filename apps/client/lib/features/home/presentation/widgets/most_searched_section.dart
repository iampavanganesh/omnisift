import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../search/domain/entities/product.dart';
import '../providers/home_providers.dart';
import 'section_header.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Home screen's "Most Searched" (last 24h) section — real data, derived from
/// logged search analytics + cached search results (see backend
/// GET /discovery/most-searched). Sparse until enough searches have happened
/// in the window; hidden entirely rather than faked. Renders nothing while
/// loading/errored/empty, same as before this was extracted out of
/// HomeScreen.build().
class MostSearchedSection extends ConsumerWidget {
  const MostSearchedSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(mostSearchedProductsProvider);
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (products) {
        if (products.isEmpty) return const SizedBox.shrink();
        return Column(
          children: [
            const SizedBox(height: AppSpacing.lg),
            const SectionHeader('Most Searched'),
            SizedBox(
              height: 172,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: products.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
                itemBuilder: (_, i) => _mostSearchedTile(context, products[i]),
              ),
            ),
          ],
        );
      },
    );
  }

  // A raw/possibly-unacquired search snapshot (token+productId), so tapping
  // goes through the same '/product' comparison-flow route search results
  // use — not the catalog-only ProductDetailScreen.fromCatalog path the
  // Deals section uses for already-acquired deals.
  Widget _mostSearchedTile(BuildContext context, Product p) => GestureDetector(
        onTap: () => context.push('/product', extra: p),
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
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.md)),
                child: Container(
                  width: 132, height: 96,
                  color: AppColors.background,
                  padding: const EdgeInsets.all(AppSpacing.xs),
                  child: p.imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: p.imageUrl,
                          fit: BoxFit.contain,
                          errorWidget: (_, __, ___) =>
                              Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                        )
                      : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xs),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.title,
                        style: AppTypography.caption, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(_inr.format(p.price),
                        style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}
