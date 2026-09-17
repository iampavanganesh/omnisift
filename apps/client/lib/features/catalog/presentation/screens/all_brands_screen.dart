import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/brand.dart';
import '../providers/catalog_providers.dart';
import '../widgets/brand_banner.dart';
import '../widgets/brand_logo.dart';
import '../../../../shared/widgets/empty_state.dart';

class AllBrandsScreen extends ConsumerWidget {
  const AllBrandsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(brandsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Top Brands')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => EmptyState(
          icon: Icons.error_outline,
          title: "Couldn't load brands",
          subtitle: 'Check your connection and try again.',
          onAction: () => ref.invalidate(brandsProvider),
        ),
        data: (brands) {
          if (brands.isEmpty) {
            return const EmptyState(
              icon: Icons.storefront_outlined,
              title: 'No brands yet',
              subtitle: 'Browse a few products and brands will show up here.',
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(AppSpacing.lg),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 0.85,
            ),
            itemCount: brands.length,
            itemBuilder: (_, i) => _BrandTile(brand: brands[i]),
          );
        },
      ),
    );
  }
}

class _BrandTile extends StatelessWidget {
  const _BrandTile({required this.brand});
  final Brand brand;

  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: AppRadius.all(AppRadius.md),
        onTap: () => context.push('/brand', extra: (brand: brand, category: null)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: brandAccentColor(brand.name).withValues(alpha: 0.08),
                borderRadius: AppRadius.all(AppRadius.md),
                border: Border.all(color: AppColors.border),
              ),
              child: ClipRRect(
                borderRadius: AppRadius.all(AppRadius.sm),
                child: BrandLogo(brand: brand, size: 40),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(brand.name,
                style: AppTypography.caption,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center),
            Text('${brand.productCount}',
                style: AppTypography.caption.copyWith(color: AppColors.textDisabled)),
          ],
        ),
      );
}
