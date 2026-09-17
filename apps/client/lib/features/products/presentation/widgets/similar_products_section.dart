import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../catalog/presentation/widgets/catalog_product_card.dart';
import '../providers/products_providers.dart';

/// Other products from the same category — always the last section on
/// Product Detail. Reuses [CatalogProductCard] (cross-feature, same
/// precedent as that card already importing ProductDetailScreen back).
class SimilarProductsSection extends ConsumerWidget {
  const SimilarProductsSection({required this.productId, super.key});
  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(similarProductsProvider(productId));
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (products) {
        if (products.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, 0, AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Similar products', style: AppTypography.title),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                height: 220,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: products.length,
                  separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (_, i) => SizedBox(
                    width: 150,
                    child: CatalogProductCard(product: products[i]),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
            ],
          ),
        );
      },
    );
  }
}
