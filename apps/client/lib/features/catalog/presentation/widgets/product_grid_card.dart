import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../search/domain/entities/product.dart';
import '../../../wishlist/presentation/widgets/wishlist_heart_button.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// 2-column grid tile for Category/Brand browsing (Search keeps its own
/// row-style ProductCard — this is purpose-built for a grid layout).
class ProductGridCard extends StatelessWidget {
  const ProductGridCard({required this.product, super.key});
  final Product product;

  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: AppRadius.all(AppRadius.lg),
        onTap: () => context.push('/product', extra: product),
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
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
                      child: Container(
                        width: double.infinity,
                        color: AppColors.background,
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        child: CachedNetworkImage(
                          imageUrl: product.imageUrl,
                          fit: BoxFit.contain,
                          errorWidget: (_, __, ___) =>
                              Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: WishlistHeartButton(product: product, filledBackground: true),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _inr.format(product.price),
                      style: AppTypography.body.copyWith(fontWeight: FontWeight.w700),
                    ),
                    if (product.rating != null) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.star, size: 12, color: Colors.amber),
                          const SizedBox(width: 2),
                          Text('${product.rating}', style: AppTypography.caption),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}
