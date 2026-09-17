import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../products/presentation/screens/product_detail_screen.dart';
import '../../domain/entities/catalog_product.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Grid tile for a real catalog product (Category/Brand detail's primary
/// section) — price/discount are computed server-side from actual observed
/// listings, never a search guess. Opens Product Detail via the tokenless
/// path (see [ProductDetailScreen.fromCatalog]).
class CatalogProductCard extends StatelessWidget {
  const CatalogProductCard({required this.product, super.key});
  final CatalogProduct product;

  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: AppRadius.all(AppRadius.lg),
        onTap: () => context.push(
          '/product',
          extra: ProductDetailScreen.fromCatalog(
            productId: product.id,
            title: product.title,
            imageUrl: product.imageUrl,
          ).product,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppRadius.all(AppRadius.lg),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2)),
            ],
          ),
          // This card sits in a GridView with a fixed childAspectRatio — at
          // large system font scaling, unclamped text would overflow the
          // fixed cell height. Clamp rather than disable scaling entirely, so
          // low-vision users still get some zoom without a broken layout.
          child: MediaQuery.withClampedTextScaling(
            maxScaleFactor: 1.3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Expanded(
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
                      child: Container(
                        width: double.infinity,
                        color: AppColors.background,
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        child: product.imageUrl != null
                            ? CachedNetworkImage(
                                imageUrl: product.imageUrl!,
                                fit: BoxFit.contain,
                                errorWidget: (_, __, ___) =>
                                    Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                              )
                            : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                      ),
                    ),
                    if (product.discountPct != null && product.discountPct! > 0)
                      Positioned(
                        left: 4,
                        top: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                              color: AppColors.success, borderRadius: BorderRadius.circular(4)),
                          child: Text('↓${product.discountPct}%',
                              style: AppTypography.caption.copyWith(color: Colors.white, fontSize: 10)),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.title,
                        maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.caption),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      product.lowestPrice != null ? _inr.format(product.lowestPrice) : 'Price unavailable',
                      style: AppTypography.body.copyWith(fontWeight: FontWeight.w700),
                    ),
                    if (product.sellerCount > 1) ...[
                      const SizedBox(height: 2),
                      Text('${product.sellerCount} sellers',
                          style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                    ],
                  ],
                ),
              ),
              ],
            ),
          ),
        ),
      );
}
