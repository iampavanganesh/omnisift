import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/brand_detail.dart';
import '../../domain/entities/category.dart';
import '../providers/catalog_listing_controller.dart';
import '../providers/catalog_listing_state.dart';
import '../providers/catalog_providers.dart';
import '../widgets/brand_banner.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../widgets/catalog_filter_sheet.dart';
import '../widgets/catalog_filter_sort_bar.dart';
import '../widgets/catalog_insights_strip.dart';
import '../widgets/catalog_product_card.dart';
import '../widgets/cross_ref_chips.dart';
import '../widgets/product_grid_card.dart';
import '../widgets/subcategory_map.dart';
import '../../domain/entities/brand.dart';

const _sortOptions = {'newest': 'Newest', 'price_asc': 'Price: Low to High', 'discount_desc': 'Biggest Drop'};

class BrandPageScreen extends ConsumerStatefulWidget {
  const BrandPageScreen({required this.brand, this.category, super.key});
  final Brand brand;

  /// When set, this is a Brand × Category page (mockup screen 4) — same
  /// screen, same backend endpoint, just cross-filtered (ADR-0003 §3).
  final Category? category;

  @override
  ConsumerState<BrandPageScreen> createState() => _BrandPageScreenState();
}

class _BrandPageScreenState extends ConsumerState<BrandPageScreen> {
  final _scroll = ScrollController();
  String _activeChip = 'All';
  String _realSort = 'newest';
  RealFilterState _realFilters = kEmptyRealFilters;

  bool get _isBrandCategory => widget.category != null;

  String get _key =>
      _isBrandCategory ? '${widget.brand.name}::${widget.category!.name}' : widget.brand.name;

  String get _pageTitle =>
      _isBrandCategory ? '${widget.brand.name} ${widget.category!.name}' : widget.brand.name;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;
    const triggerDistance = 3 * 160.0;
    final nearBottom =
        _scroll.position.pixels >= _scroll.position.maxScrollExtent - triggerDistance;
    if (nearBottom) {
      ref.read(catalogListingControllerProvider(_key).notifier).loadMore();
    }
  }

  void _selectChip(String chip) {
    setState(() => _activeChip = chip);
    final base =
        _isBrandCategory ? '${widget.brand.name} ${widget.category!.name}' : widget.brand.name;
    final query = chip == 'All' ? base : '$base $chip';
    ref.read(catalogListingControllerProvider(_key).notifier).refine(query);
  }

  void _openSort() {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Align(alignment: Alignment.centerLeft, child: Text('Sort by', style: AppTypography.title)),
            ),
            ..._sortOptions.entries.map((e) => RadioListTile<String>(
                  value: e.key,
                  groupValue: _realSort,
                  title: Text(e.value),
                  activeColor: AppColors.primary,
                  onChanged: (v) {
                    setState(() => _realSort = v ?? 'newest');
                    Navigator.pop(sheetContext);
                  },
                )),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(catalogListingControllerProvider(_key));
    final chips = subchipsFor(brandTypeChips, widget.brand.name);
    final detailAsync = ref.watch(brandDetailProvider((
      slug: widget.brand.slug,
      sort: _realSort,
      category: widget.category?.slug,
      minPrice: _realFilters.minPrice,
      maxPrice: _realFilters.maxPrice,
      minRating: _realFilters.minRating,
    )));
    final hasRealFilters =
        _realFilters.minPrice != null || _realFilters.maxPrice != null || _realFilters.minRating > 0;
    // Always prefer the freshly-fetched detail (authoritative) over whatever
    // was known at the tap origin — a cross-reference chip, for instance,
    // never carries logoUrl/description.
    final description = detailAsync.value?.description ?? widget.brand.description;
    final productCount = detailAsync.value?.insights.productCount ?? widget.brand.productCount;

    return Scaffold(
      appBar: AppBar(title: Text(_pageTitle)),
      body: CustomScrollView(
        controller: _scroll,
        slivers: [
          // Brand-level hero/about are redundant once already filtered to one
          // category — the top-level brand page is where they belong.
          if (!_isBrandCategory) SliverToBoxAdapter(child: BrandBanner(brand: widget.brand)),
          if (!_isBrandCategory && description != null) SliverToBoxAdapter(child: _about(description)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.07),
                  borderRadius: AppRadius.all(AppRadius.sm),
                ),
                child: Text('$productCount products',
                    style: AppTypography.caption.copyWith(color: AppColors.primary)),
              ),
            ),
          ),
          if (chips.length > 1)
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xs),
                  itemCount: chips.length,
                  separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (_, i) => ChoiceChip(
                    label: Text(chips[i]),
                    selected: _activeChip == chips[i],
                    selectedColor: AppColors.primary.withValues(alpha: 0.12),
                    onSelected: (_) => _selectChip(chips[i]),
                  ),
                ),
              ),
            ),
          // Real catalog section — precise cross-seller price intelligence.
          detailAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            data: (detail) => SliverToBoxAdapter(
              child: _realSection(context, detail, hasRealFilters),
            ),
          ),
          ..._searchBackfillSlivers(state),
        ],
      ),
    );
  }

  Widget _realSection(BuildContext context, BrandDetail detail, bool hasRealFilters) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CatalogInsightsStrip(insights: detail.insights),
          CrossRefChips(
            title: 'Categories',
            refs: detail.categoriesForBrand,
            // Brand × Category (mockup screen 4) — same screen, cross-filtered,
            // not a plain category page (ADR-0003 §3).
            onTap: (r) => context.push(
              '/brand',
              extra: (
                brand: widget.brand,
                category: Category(id: r.id, name: r.name, slug: r.slug, productCount: r.productCount),
              ),
            ),
          ),
          CrossRefChips(title: 'Where it\'s sold', refs: detail.sellersForBrand),
          CatalogFilterSortBar(
            resultCount: detail.insights.productCount,
            sortActive: _realSort != 'newest',
            filterActive: hasRealFilters,
            onSort: _openSort,
            onFilter: () => showCatalogFilterSheet(
              context,
              backfillKey: _key,
              real: _realFilters,
              realResultCount: detail.insights.productCount,
              // No multi-brand facet here — the page is already scoped to one brand.
              onApplyReal: (next) => setState(() => _realFilters = next),
            ),
          ),
          if (detail.products.isEmpty)
            EmptyState(
              icon: Icons.search_off,
              title: 'No products match your filters',
              subtitle: 'Try widening your price range or clearing filters.',
              onAction: () => setState(() => _realFilters = kEmptyRealFilters),
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

  Widget _about(String description) => Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('About ${widget.brand.name}', style: AppTypography.title),
            const SizedBox(height: AppSpacing.xs),
            Text(description, style: AppTypography.body),
          ],
        ),
      );

  List<Widget> _searchBackfillSlivers(CatalogListingState state) {
    switch (state.status) {
      case CatalogListingStatus.idle:
      case CatalogListingStatus.loading:
        return const [SliverToBoxAdapter(child: Center(child: CircularProgressIndicator()))];
      case CatalogListingStatus.error:
        return [
          SliverToBoxAdapter(
            child: EmptyState(
              icon: Icons.error_outline,
              title: "Couldn't load more results",
              subtitle: 'Check your connection and try again.',
              onAction: () => ref.read(catalogListingControllerProvider(_key).notifier).load(),
            ),
          ),
        ];
      case CatalogListingStatus.empty:
        return const [
          SliverToBoxAdapter(
            child: EmptyState(
              icon: Icons.search_off,
              title: 'Nothing else to explore right now',
              subtitle: 'Check back soon as more products get added.',
            ),
          ),
        ];
      case CatalogListingStatus.success:
        if (state.products.isEmpty) {
          return [
            SliverToBoxAdapter(
              child: EmptyState(
                icon: Icons.search_off,
                title: 'No products match your filters',
                subtitle: 'Try widening your price range or clearing filters.',
                onAction: () => ref.read(catalogListingControllerProvider(_key).notifier).clearFilters(),
                actionLabel: 'Clear Filters',
              ),
            ),
          ];
        }
        return [
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: AppSpacing.md,
                crossAxisSpacing: AppSpacing.md,
                childAspectRatio: 0.62,
              ),
              delegate: SliverChildBuilderDelegate(
                (_, i) => ProductGridCard(product: state.products[i]),
                childCount: state.products.length,
              ),
            ),
          ),
          if (state.isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
        ];
    }
  }
}
