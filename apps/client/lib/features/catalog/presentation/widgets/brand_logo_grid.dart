import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/brand.dart';
import '../../domain/entities/catalog_product.dart';
import 'brand_logo.dart';

/// Horizontal row of tappable brand-logo tiles — the "10 mobile companies"
/// style row on a category storefront page. Each tile synthesizes a minimal
/// [Brand] from the [NamedRef] (real `logoUrl` from the backend when set) and
/// reuses [BrandLogo]'s existing real-URL → Clearbit → favicon → initial
/// fallback chain unchanged.
class BrandLogoGrid extends StatelessWidget {
  const BrandLogoGrid({required this.refs, required this.onTap, super.key});
  final List<NamedRef> refs;
  final ValueChanged<NamedRef> onTap;

  @override
  Widget build(BuildContext context) {
    if (refs.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 92,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: refs.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
        itemBuilder: (_, i) => _tile(refs[i]),
      ),
    );
  }

  Widget _tile(NamedRef ref) {
    final brand = Brand(
      id: ref.id,
      name: ref.name,
      slug: ref.slug,
      productCount: ref.productCount,
      logoUrl: ref.logoUrl,
      description: null,
    );
    return GestureDetector(
      onTap: () => onTap(ref),
      child: SizedBox(
        width: 72,
        child: Column(children: [
          Container(
            width: 56,
            height: 56,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.all(AppRadius.md),
              border: Border.all(color: AppColors.border),
            ),
            child: ClipRRect(
              borderRadius: AppRadius.all(AppRadius.sm),
              child: BrandLogo(brand: brand, size: 40),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(ref.name, style: AppTypography.caption, maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}
