import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../search/domain/entities/product.dart';
import '../../domain/entities/brand.dart';
import '../../domain/entities/catalog_product.dart';
import '../../domain/entities/category.dart';
import '../../domain/entities/category_detail.dart';
import 'brand_logo_grid.dart';
import 'catalog_filter_sheet.dart';
import 'catalog_filter_sort_bar.dart';
import 'catalog_insights_strip.dart';
import 'catalog_product_card.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// The loaded-state content of CategoryListingScreen's real-catalog sliver:
/// Shop by Brand, [Category] Intelligence, Category Insights, Best Deals,
/// the filter/sort bar, and the tracked-products grid. Extracted out of
/// CategoryListingScreen.build() (P1 maintainability pass) — pure
/// reorganization, same widget tree, same behavior.
class CategoryDetailContent extends StatelessWidget {
  const CategoryDetailContent({
    required this.category,
    required this.detail,
    required this.mostSearchedAsync,
    required this.bestDealsAsync,
    required this.facetsAsync,
    required this.realSort,
    required this.realFilters,
    required this.hasRealFilters,
    required this.backfillKey,
    required this.onSort,
    required this.onApplyFilters,
    required this.onClearFilters,
    super.key,
  });

  final Category category;
  final CategoryDetail detail;
  final AsyncValue<List<Product>> mostSearchedAsync;
  final AsyncValue<CategoryDetail> bestDealsAsync;
  final AsyncValue<List<CategoryFacet>> facetsAsync;
  final String realSort;
  final RealFilterState realFilters;
  final bool hasRealFilters;
  final String backfillKey;
  final VoidCallback onSort;
  final ValueChanged<RealFilterState> onApplyFilters;
  final VoidCallback onClearFilters;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (detail.brandsInCategory.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
            child: Text('Shop by Brand', style: AppTypography.title),
          ),
          const SizedBox(height: AppSpacing.sm),
          BrandLogoGrid(
            refs: detail.brandsInCategory,
            // Brand × Category cross-filter — tapping a logo from within a
            // category should stay scoped to that category's products from
            // that brand, not the brand's full mixed catalog across every
            // category.
            onTap: (r) => context.push(
              '/brand',
              extra: (
                brand: Brand(
                  id: r.id, name: r.name, slug: r.slug,
                  productCount: r.productCount, logoUrl: r.logoUrl, description: null,
                ),
                category: category,
              ),
            ),
          ),
        ],
        _intelligenceRow(context, mostSearchedAsync, detail.topDeal),
        CatalogInsightsStrip(insights: detail.insights),
        _bestDealsSection(bestDealsAsync),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
          child: Text('All ${category.name} Products', style: AppTypography.title),
        ),
        CatalogFilterSortBar(
          resultCount: detail.insights.productCount,
          sortActive: realSort != 'newest',
          filterActive: hasRealFilters,
          onSort: onSort,
          onFilter: () => showCatalogFilterSheet(
            context,
            backfillKey: backfillKey,
            real: realFilters,
            realResultCount: detail.insights.productCount,
            realBrandOptions: detail.brandsInCategory,
            realFacetOptions: facetsAsync.value ?? const [],
            onApplyReal: onApplyFilters,
          ),
        ),
        if (detail.products.isEmpty)
          EmptyState(
            icon: Icons.search_off,
            title: 'No products match your filters',
            subtitle: 'Try widening your price range or clearing filters.',
            onAction: onClearFilters,
            actionLabel: 'Clear Filters',
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: AppSpacing.md,
                crossAxisSpacing: AppSpacing.md,
                childAspectRatio: 0.62,
              ),
              itemCount: detail.products.length,
              itemBuilder: (_, i) => CatalogProductCard(product: detail.products[i]),
            ),
          ),
        const Divider(height: AppSpacing.xl),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 0),
          child: Text('More to Explore', style: AppTypography.title),
        ),
      ],
    );
  }

  /// "[Category] Intelligence" — real, data-driven widgets only. Each card
  /// only renders when it has real data; no "Best value" card exists here —
  /// there's no honest signal for it yet (no seller-quality or per-product
  /// popularity data), and it won't be faked.
  Widget _intelligenceRow(
    BuildContext context,
    AsyncValue<List<Product>> mostSearchedAsync,
    CatalogProduct? topDeal,
  ) {
    final mostSearched = mostSearchedAsync.value;
    final hasMostSearched = mostSearched != null && mostSearched.isNotEmpty;
    final hasTopDeal = topDeal != null;
    if (!hasMostSearched && !hasTopDeal) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${category.name} Intelligence', style: AppTypography.title),
          const SizedBox(height: AppSpacing.sm),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasMostSearched)
                  Expanded(
                    child: _intelligenceCard(
                      label: 'Most searched in ${category.name}',
                      child: _mostSearchedTile(context, mostSearched.first),
                    ),
                  ),
                if (hasMostSearched && hasTopDeal) const SizedBox(width: AppSpacing.md),
                if (hasTopDeal)
                  Expanded(
                    child: _intelligenceCard(
                      // `topDeal` is the highest discountPct row (the seller's
                      // advertised discount off list price), not an observed
                      // drop from a price OmniSift recorded earlier.
                      label: 'Biggest discount',
                      child: SizedBox(height: 220, child: CatalogProductCard(product: topDeal)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _intelligenceCard({required String label, required Widget child}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: AppTypography.caption.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
          const SizedBox(height: AppSpacing.sm),
          child,
        ],
      );

  Widget _mostSearchedTile(BuildContext context, Product p) => GestureDetector(
        onTap: () => context.push('/product', extra: p),
        child: Container(
          height: 220,
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
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.caption),
                    const SizedBox(height: AppSpacing.xs),
                    Text(_inr.format(p.price), style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

  /// Real discount ranking (independent of the user's chosen sort) — a
  /// discount-only proxy, explicitly not a multi-factor deal score (no
  /// seller-quality or per-product popularity signal exists yet to back one).
  Widget _bestDealsSection(AsyncValue<CategoryDetail> bestDealsAsync) {
    final bestDetail = bestDealsAsync.value;
    if (bestDetail == null) return const SizedBox.shrink();
    final deals = bestDetail.products
        .where((p) => p.discountPct != null && p.discountPct! > 0)
        .take(8)
        .toList();
    if (deals.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
          child: Text('Best ${category.name} Deals', style: AppTypography.title),
        ),
        const SizedBox(height: AppSpacing.sm),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 0.62,
            ),
            itemCount: deals.length,
            itemBuilder: (_, i) => CatalogProductCard(product: deals[i]),
          ),
        ),
      ],
    );
  }
}
