import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/product.dart';
import 'recent_searches_controller.dart';
import 'search_providers.dart';
import 'search_state.dart';

final searchControllerProvider =
    NotifierProvider<SearchController, SearchState>(SearchController.new);

class SearchController extends Notifier<SearchState> {
  List<Product> _all = const [];

  // The backend caps API SPEND (app_config.max_api_calls) AND enforces a hard
  // page ceiling (PAGINATION.MAX_PAGES, search.schemas.ts) — scrolling past it
  // is rejected, not silently served. `hasMore` below always comes straight
  // from the backend's real meta.hasMore, which already accounts for both.
  //
  // De-dupe guard: ignore an identical search fired within 1.5s (double-trigger guard).
  String? _lastQuery;
  DateTime? _lastSearchAt;

  @override
  SearchState build() => const SearchState();

  List<String> get availablePlatforms => _all.map((p) => p.platform).toSet().toList()..sort();

  List<String> get availableCategories => _all
      .map((p) => p.category)
      .where((c) => c.isNotEmpty && c != 'Uncategorized')
      .toSet()
      .toList()
    ..sort();

  Future<void> search(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;

    // Skip if the exact same query was just fired < 1.5s ago (kills double API calls).
    final now = DateTime.now();
    if (_lastQuery == q &&
        _lastSearchAt != null &&
        now.difference(_lastSearchAt!).inMilliseconds < 1500) {
      return;
    }
    _lastQuery = q;
    _lastSearchAt = now;

    state = state.copyWith(status: SearchStatus.loading, query: q);
    try {
      final result = await ref.read(searchProductsUseCaseProvider)(q);
      final products = result.products;
      _all = products;
      state = state.copyWith(
        status: products.isEmpty ? SearchStatus.empty : SearchStatus.success,
        totalCount: products.length,
        // reset filters/sort/pagination on a fresh search
        sort: SortOption.relevance,
        platformFilter: const {},
        categoryFilter: const {},
        ratingFilter: false,
        currentPage: 0,
        isLoadingMore: false,
        hasMore: result.hasMore,
      );
      _apply();
      ref.read(recentSearchesProvider.notifier)
          .add(q, products.isNotEmpty ? products.first.imageUrl : '');
    } on Failure catch (f) {
      state = state.copyWith(status: SearchStatus.error, failure: f);
    }
  }

  /// Loads the next page and appends. Stops exactly when the backend's real
  /// `hasMore` says so — the true end of saved data OR the real page ceiling,
  /// whichever comes first. Guarded against double-loading.
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    if (state.status != SearchStatus.success) return;

    final nextPage = state.currentPage + 1;

    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref.read(searchProductsUseCaseProvider)(state.query, page: nextPage);
      _all = [..._all, ...result.products];
      state = state.copyWith(
        currentPage: nextPage,
        isLoadingMore: false,
        hasMore: result.hasMore,
        totalCount: _all.length,
      );
      _apply();
    } on Failure catch (_) {
      // stop paginating on error, keep what we already have
      state = state.copyWith(isLoadingMore: false, hasMore: false);
    }
  }

  void setSort(SortOption option) {
    state = state.copyWith(sort: option);
    _apply();
  }

  void togglePlatform(String platform) {
    final set = {...state.platformFilter};
    set.contains(platform) ? set.remove(platform) : set.add(platform);
    state = state.copyWith(platformFilter: set);
    _apply();
  }

  void toggleCategory(String category) {
    final set = {...state.categoryFilter};
    set.contains(category) ? set.remove(category) : set.add(category);
    state = state.copyWith(categoryFilter: set);
    _apply();
  }

  void setRatingFilter(bool value) {
    state = state.copyWith(ratingFilter: value);
    _apply();
  }

  void clearFilters() {
    state = state.copyWith(
      platformFilter: const {},
      categoryFilter: const {},
      ratingFilter: false,
    );
    _apply();
  }

  void _apply() {
    var list = _all.where((p) {
      if (state.platformFilter.isNotEmpty && !state.platformFilter.contains(p.platform)) return false;
      if (state.categoryFilter.isNotEmpty && !state.categoryFilter.contains(p.category)) return false;
      if (state.ratingFilter && (p.rating ?? 0) < 4) return false;
      return true;
    }).toList();

    switch (state.sort) {
      case SortOption.priceLowHigh:
        list.sort((a, b) => a.price.compareTo(b.price));
      case SortOption.priceHighLow:
        list.sort((a, b) => b.price.compareTo(a.price));
      case SortOption.rating:
        list.sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));
      case SortOption.relevance:
        break; // keep provider order
    }
    state = state.copyWith(products: list);
  }

  /// Patch one product's price/rating/reviews in the current search list, using
  /// fresh compare data (the cheapest seller). Called when the user opens a
  /// product's compare — so returning to search shows the healed price, no reload,
  /// no API. Only lowers the price (cheapest wins), mirroring the backend.
  void patchProductPrice(
    String productId, {
    double? price,
    double? rating,
    int? reviewCount,
  }) {
    // ignore: avoid_print
    print('🩹 patchProductPrice called: id=$productId price=$price');
    var touched = false;
    _all = _all.map((p) {
      if (p.productId != productId) return p;
      // cheapest wins — only overwrite if the new price is lower
      final newPrice = (price != null && price > 0 && price < p.price) ? price : p.price;
      if (newPrice == p.price && rating == null && reviewCount == null) return p;
      touched = true;
      return p.copyWith(
        price: newPrice,
        rating: rating ?? p.rating,
        reviewCount: reviewCount ?? p.reviewCount,
      );
    }).toList();
    if (touched) _apply(); // re-runs filter/sort and pushes new state
  }

  void clear() {
    _all = const [];
    state = const SearchState();
  }
}

/// Debounced search suggestions (free Google autocomplete via backend).
final suggestionsProvider =
    NotifierProvider<SuggestionsController, List<String>>(SuggestionsController.new);

class SuggestionsController extends Notifier<List<String>> {
  Timer? _debounce;

  @override
  List<String> build() {
    ref.onDispose(() => _debounce?.cancel());
    return const [];
  }

  void query(String q) {
    _debounce?.cancel();
    if (q.trim().length < 2) {
      state = const [];
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      state = await ref.read(searchRepositoryProvider).suggestions(q.trim());
    });
  }

  void clear() {
    _debounce?.cancel();
    state = const [];
  }
}