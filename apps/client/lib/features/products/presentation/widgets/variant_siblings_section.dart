import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../catalog/domain/entities/catalog_product.dart';
import '../providers/products_providers.dart';
import '../screens/product_detail_screen.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// "Also Available As" — REAL other listings of the same base model (a
/// different colour/storage scraped as its own product, with its own real
/// price). Unlike the informational option chips on the product page, tapping
/// one of these is a real navigation to that product's own price/store list.
/// Empty (renders nothing) when no such real duplicate listing exists yet —
/// the common case today.
class VariantSiblingsSection extends ConsumerWidget {
  const VariantSiblingsSection({required this.productId, super.key});
  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(variantSiblingsProvider(productId));
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (siblings) {
        final others = siblings.where((s) => !s.isCurrent).toList();
        if (others.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Also Available As', style: AppTypography.title),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                height: 220,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: others.length,
                  separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (_, i) => SizedBox(
                    width: 150,
                    child: _VariantSiblingCard(sibling: others[i]),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _VariantSiblingCard extends StatelessWidget {
  const _VariantSiblingCard({required this.sibling});
  final VariantSibling sibling;

  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: AppRadius.all(AppRadius.lg),
        onTap: () => context.push(
          '/product',
          extra: ProductDetailScreen.fromCatalog(
            productId: sibling.id,
            title: sibling.title,
            imageUrl: sibling.imageUrl,
          ).product,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.all(AppRadius.lg),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
                  child: Container(
                    width: double.infinity,
                    color: AppColors.background,
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    child: sibling.imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: sibling.imageUrl!,
                            fit: BoxFit.contain,
                            errorWidget: (_, __, ___) =>
                                Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                          )
                        : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(sibling.label,
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.caption),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      sibling.lowestPrice != null ? _inr.format(sibling.lowestPrice) : 'Price unavailable',
                      style: AppTypography.body.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}
