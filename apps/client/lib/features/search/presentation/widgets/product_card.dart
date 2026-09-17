import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/product.dart';
import '../../../wishlist/presentation/widgets/wishlist_heart_button.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class ProductCard extends StatelessWidget {
  const ProductCard({required this.product, required this.onTap, super.key});
  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.all(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      child: Stack(
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: AppRadius.all(AppRadius.lg),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: AppRadius.all(AppRadius.md),
                      child: Container(
                        color: AppColors.background,
                        padding: const EdgeInsets.all(4),
                        child: CachedNetworkImage(
                          imageUrl: product.imageUrl,
                          width: 76,
                          height: 76,
                          fit: BoxFit.contain,
                          errorWidget: (_, __, ___) => SizedBox(
                            width: 76,
                            height: 76,
                            child: Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(product.title,
                                maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.body),
                            const SizedBox(height: AppSpacing.xs),
                            Text('From ${_inr.format(product.price)}',
                                style: AppTypography.title.copyWith(
                                    color: AppColors.primary, fontWeight: FontWeight.w700)),
                            const SizedBox(height: AppSpacing.xs),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.07),
                                    borderRadius: AppRadius.all(AppRadius.sm),
                                  ),
                                  child: Text(product.platform,
                                      style: AppTypography.caption.copyWith(color: AppColors.primary)),
                                ),
                                const Spacer(),
                                Text(_inr.format(product.price),
                                    style: AppTypography.caption.copyWith(color: AppColors.textPrimary)),
                              ],
                            ),
                            if (product.rating != null) ...[
                              const SizedBox(height: AppSpacing.xs),
                              Row(children: [
                                const Icon(Icons.star, size: 13, color: AppColors.warning),
                                Text(' ${product.rating}'
                                    '${product.reviewCount != null ? '  (${product.reviewCount})' : ''}',
                                    style: AppTypography.caption),
                              ]),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(top: 2, right: 2, child: WishlistHeartButton(product: product)),
        ],
      ),
    );
  }
}
