import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/category.dart';
import '../providers/catalog_listing_controller.dart';
import '../providers/catalog_listing_state.dart';
import '../providers/catalog_providers.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../widgets/catalog_filter_sheet.dart';
import '../widgets/category_banner.dart';
import '../widgets/category_detail_content.dart';
import '../widgets/product_grid_card.dart';
import '../widgets/subcategory_map.dart';

const _sortOptions = {'newest': 'Newest', 'price_asc': 'Price: Low to High', 'discount_desc': 'Biggest Drop'};

class CategoryListingScreen extends ConsumerStatefulWidget {
  const CategoryListingScreen({required this.category, this.initialChip, super.key});
  final Category category;

  /// Pre-selects a subcategory chip (e.g. tapped from the All Categories
  /// sidebar's subcategory grid) instead of landing on 'All'.
  final String? initialChip;

  @override
  ConsumerState<CategoryListingScreen> createState() => _CategoryListingScreenState();
}

class _CategoryListingScreenState extends ConsumerState<CategoryListingScreen> {
  final _scroll = ScrollController();
  String _activeChip = 'All';
  String _realSort = 'newest';
  RealFilterState _realFilters = kEmptyRealFilters;

  String get _key => widget.category.name;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    final chip = widget.initialChip;
    if (chip != null && chip != 'All') {
      _activeChip = chip;
      WidgetsBinding.instance.addPostFrameCallback((_) => _selectChip(chip));
    }
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
    final query = chip == 'All' ? widget.category.name : '${widget.category.name} $chip';
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
    final chips = subchipsFor(categorySubchips, widget.category.name);
    final brandsKey = ([..._realFilters.brandSlugs]..sort()).join(',');
    final specsKey = encodeSpecsKey(_realFilters.specs);
    final facetsAsync = ref.watch(categoryFacetsProvider(widget.category.slug));
    final detailAsync = ref.watch(categoryDetailProvider((
      slug: widget.category.slug,
      sort: _realSort,
      minPrice: _realFilters.minPrice,
      maxPrice: _realFilters.maxPrice,
      brandsKey: brandsKey,
      minRating: _realFilters.minRating,
      specsKey: specsKey,
    )));
    // Independent of the user's chosen sort — always the real discount
    // ranking, for the "Best Deals" section below.
    final bestDealsAsync = ref.watch(categoryDetailProvider((
      slug: widget.category.slug,
      sort: 'discount_desc',
      minPrice: _realFilters.minPrice,
      maxPrice: _realFilters.maxPrice,
      brandsKey: brandsKey,
      minRating: _realFilters.minRating,
      specsKey: specsKey,
    )));
    final mostSearchedAsync = ref.watch(mostSearchedInCategoryProvider(widget.category.slug));
    final hasRealFilters = _realFilters.minPrice != null ||
        _realFilters.maxPrice != null ||
        _realFilters.brandSlugs.isNotEmpty ||
        _realFilters.minRating > 0 ||
        _realFilters.specs.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: Text(widget.category.name)),
      body: CustomScrollView(
        controller: _scroll,
        slivers: [
          SliverToBoxAdapter(child: CategoryBanner(category: widget.category)),
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
          // Real catalog section — precise, price-comparison-grade data.
          detailAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.xl),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            data: (detail) => SliverToBoxAdapter(
              child: CategoryDetailContent(
                category: widget.category,
                detail: detail,
                mostSearchedAsync: mostSearchedAsync,
                bestDealsAsync: bestDealsAsync,
                facetsAsync: facetsAsync,
                realSort: _realSort,
                realFilters: _realFilters,
                hasRealFilters: hasRealFilters,
                backfillKey: _key,
                onSort: _openSort,
                onApplyFilters: (next) => setState(() => _realFilters = next),
                onClearFilters: () => setState(() => _realFilters = kEmptyRealFilters),
              ),
            ),
          ),
          ..._searchBackfillSlivers(state),
        ],
      ),
    );
  }

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
