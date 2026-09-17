import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/filter_sort_pill.dart';
import '../providers/recent_searches_controller.dart';
import '../providers/search_controller.dart';
import '../providers/search_state.dart';
import '../widgets/product_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  // Auto-load the next page when the user is ~3 products from the bottom.
  void _onScroll() {
    if (!_scroll.hasClients) return;
    const triggerDistance = 3 * 120.0; // ~3 product cards from the end
    final nearBottom = _scroll.position.pixels >=
        _scroll.position.maxScrollExtent - triggerDistance;
    if (nearBottom) {
      ref.read(searchControllerProvider.notifier).loadMore();
    }
  }

  void _run(String q) {
    _controller.text = q;
    _focus.unfocus();
    ref.read(suggestionsProvider.notifier).clear();
    ref.read(searchControllerProvider.notifier).search(q);
  }

  void _clear() {
    _controller.clear();
    ref.read(suggestionsProvider.notifier).clear();
    ref.read(searchControllerProvider.notifier).clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(searchControllerProvider);
    final suggestions = ref.watch(suggestionsProvider);
    final isEmpty = _controller.text.trim().isEmpty;
    final showSuggestions =
        _focus.hasFocus && suggestions.isNotEmpty && !isEmpty;
    ref.listen(searchControllerProvider.select((s) => s.query), (_, q) {
      if (q.isNotEmpty && q != _controller.text) _controller.text = q;
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Search')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.sm),
            child: TextField(
              controller: _controller,
              focusNode: _focus,
              textInputAction: TextInputAction.search,
              onChanged: (q) {
                setState(() {});
                ref.read(suggestionsProvider.notifier).query(q);
              },
              onSubmitted: _run,
              decoration: InputDecoration(
                hintText: 'Search for products, brands and more…',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: isEmpty
                    ? IconButton(
                        icon: const Icon(Icons.arrow_forward),
                        tooltip: 'Search',
                        onPressed: () => _run(_controller.text))
                    : IconButton(
                        icon: const Icon(Icons.close), tooltip: 'Clear', onPressed: _clear),
              ),
            ),
          ),
          if (!showSuggestions &&
              !isEmpty &&
              state.status == SearchStatus.success)
            _filterSortBar(state),
          Expanded(
            child: isEmpty
                ? _recentSearches()
                : (showSuggestions
                    ? _suggestionList(suggestions)
                    : _body(state)),
          ),
        ],
      ),
    );
  }

  Widget _recentSearches() {
    final recent = ref.watch(recentSearchesProvider);
    if (recent.isEmpty) {
      return _centered(
          'Search across Amazon, Flipkart & more.\nBuy with confidence.');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recent searches', style: AppTypography.title),
              TextButton(
                onPressed: () =>
                    ref.read(recentSearchesProvider.notifier).clear(),
                child: const Text('Clear'),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: recent.length,
            itemBuilder: (_, i) => ListTile(
              leading: Icon(Icons.history, color: AppColors.textSecondary),
              title: Text(recent[i].query, style: AppTypography.body),
              trailing: Icon(Icons.north_west,
                  size: 16, color: AppColors.textDisabled),
              onTap: () => _run(recent[i].query),
            ),
          ),
        ),
      ],
    );
  }

  Widget _filterSortBar(SearchState state) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.sm),
          child: Row(
            children: [
              Text('${state.products.length} of ${state.totalCount} results',
                  style: AppTypography.caption),
              const Spacer(),
              FilterSortPill(
                icon: Icons.filter_list,
                label: 'Filter',
                active: state.hasActiveFilters,
                onTap: _openFilter,
              ),
              const SizedBox(width: AppSpacing.sm),
              FilterSortPill(
                icon: Icons.swap_vert,
                label: 'Sort',
                active: state.sort != SortOption.relevance,
                onTap: _openSort,
              ),
            ],
          ),
        ),
        const Divider(height: 1),
      ],
    );
  }

  void _openSort() {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => Consumer(builder: (_, ref, __) {
        final current = ref.watch(searchControllerProvider).sort;
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Sort by', style: AppTypography.title)),
              ),
              ...SortOption.values.map((o) => RadioListTile<SortOption>(
                    value: o,
                    groupValue: current,
                    title: Text(o.label),
                    activeColor: AppColors.primary,
                    onChanged: (v) {
                      ref.read(searchControllerProvider.notifier).setSort(v!);
                      Navigator.pop(sheetContext);
                    },
                  )),
              const SizedBox(height: AppSpacing.sm),
            ],
          ),
        );
      }),
    );
  }

  void _openFilter() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Consumer(builder: (_, ref, __) {
        final ctrl = ref.read(searchControllerProvider.notifier);
        final state = ref.watch(searchControllerProvider);
        final platforms = ctrl.availablePlatforms;
        final categories = ctrl.availableCategories;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Filters', style: AppTypography.title),
                      TextButton(
                          onPressed: ctrl.clearFilters,
                          child: const Text('Clear all')),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text('Stores', style: AppTypography.caption),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: platforms
                        .map((p) => FilterChip(
                              label: Text(p),
                              selected: state.platformFilter.contains(p),
                              selectedColor:
                                  AppColors.primary.withValues(alpha: 0.12),
                              checkmarkColor: AppColors.primary,
                              onSelected: (_) => ctrl.togglePlatform(p),
                            ))
                        .toList(),
                  ),
                  if (categories.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.md),
                    Text('Category', style: AppTypography.caption),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: categories
                          .map((c) => FilterChip(
                                label: Text(c),
                                selected: state.categoryFilter.contains(c),
                                selectedColor:
                                    AppColors.primary.withValues(alpha: 0.12),
                                checkmarkColor: AppColors.primary,
                                onSelected: (_) => ctrl.toggleCategory(c),
                              ))
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('4★ & above only'),
                    value: state.ratingFilter,
                    activeColor: AppColors.primary,
                    onChanged: ctrl.setRatingFilter,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.pop(sheetContext),
                      child: Text('Show ${state.products.length} results'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _suggestionList(List<String> s) => ListView.builder(
        itemCount: s.length,
        itemBuilder: (_, i) => ListTile(
          leading: Icon(Icons.search, size: 20, color: AppColors.textSecondary),
          title: Text(s[i], style: AppTypography.body),
          trailing:
              Icon(Icons.north_west, size: 16, color: AppColors.textDisabled),
          onTap: () => _run(s[i]),
        ),
      );

  Widget _body(SearchState state) {
    switch (state.status) {
      case SearchStatus.idle:
        return _centered(
            'Search across Amazon, Flipkart & more.\nBuy with confidence.');
      case SearchStatus.loading:
        return const Center(child: CircularProgressIndicator());
      case SearchStatus.empty:
        return _centered('No products found for "${state.query}".');
      case SearchStatus.error:
        return _centered(state.failure?.message ?? 'Something went wrong.');
      case SearchStatus.success:
        if (state.products.isEmpty)
          return _centered('No results match your filters.');
        // +1 row at the end for the bottom loading spinner (only while loading more)
        final itemCount = state.products.length + (state.isLoadingMore ? 1 : 0);
        return ListView.builder(
          controller: _scroll,
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.lg),
          itemCount: itemCount,
          itemBuilder: (_, i) {
            if (i >= state.products.length) {
              return const Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final p = state.products[i];
            return ProductCard(
                product: p, onTap: () => context.push('/product', extra: p));
          },
        );
    }
  }

  Widget _centered(String text) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Text(text,
              textAlign: TextAlign.center, style: AppTypography.body),
        ),
      );
}
