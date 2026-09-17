import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/failure.dart';
import '../../../search/domain/entities/product.dart';
import '../../../search/presentation/providers/search_providers.dart';
import '../../../search/presentation/providers/search_state.dart' show SortOption;
import 'catalog_listing_state.dart';

/// One controller instance per category/brand query string (e.g. "Mobiles" or
/// "Samsung"). Reuses the same search pipeline as the Search tab (so results
/// are never empty on a fresh install — see backend `deals`/catalog docs for
/// why category/brand browsing is layered on top of search rather than a
/// separate, sparser catalog-only query), with price/brand/rating filters
/// layered on top instead of Search's platform/store chips.
final catalogListingControllerProvider = NotifierProvider.family<CatalogListingController,
    CatalogListingState, String>((query) => CatalogListingController(query));

class CatalogListingController extends Notifier<CatalogListingState> {
  CatalogListingController(this.arg);

  /// The category/brand (+ optional subcategory keyword) this instance searches.
  final String arg;
  List<Product> _all = const [];

  @override
  CatalogListingState build() {
    Future.microtask(load);
    return const CatalogListingState();
  }

  List<String> get availableBrands =>
      _all.map((p) => p.brand).where((b) => b.isNotEmpty).toSet().toList()..sort();

  ({double min, double max}) get priceBounds {
    if (_all.isEmpty) return (min: 0, max: 0);
    final prices = _all.map((p) => p.price).toList()..sort();
    return (min: prices.first, max: prices.last);
  }

  Future<void> load() async {
    state = state.copyWith(status: CatalogListingStatus.loading);
    try {
      final result = await ref.read(searchProductsUseCaseProvider)(arg);
      final products = result.products;
      _all = products;
      state = state.copyWith(
        status: products.isEmpty ? CatalogListingStatus.empty : CatalogListingStatus.success,
        totalCount: products.length,
        currentPage: 0,
        isLoadingMore: false,
        hasMore: result.hasMore,
      );
      _apply();
    } on Failure catch (f) {
      state = state.copyWith(status: CatalogListingStatus.error, failure: f);
    }
  }

  /// Re-runs the underlying search with a refined query (e.g. subcategory chip).
  Future<void> refine(String query) async {
    state = state.copyWith(status: CatalogListingStatus.loading);
    try {
      final result = await ref.read(searchProductsUseCaseProvider)(query);
      final products = result.products;
      _all = products;
      state = state.copyWith(
        status: products.isEmpty ? CatalogListingStatus.empty : CatalogListingStatus.success,
        totalCount: products.length,
        currentPage: 0,
        isLoadingMore: false,
        hasMore: result.hasMore,
        brandFilter: const {},
        clearPriceRange: true,
        minRating: 0,
      );
      _apply();
    } on Failure catch (f) {
      state = state.copyWith(status: CatalogListingStatus.error, failure: f);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    if (state.status != CatalogListingStatus.success) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final result = await ref.read(searchProductsUseCaseProvider)(arg, page: nextPage);
      _all = [..._all, ...result.products];
      state = state.copyWith(
        currentPage: nextPage,
        isLoadingMore: false,
        hasMore: result.hasMore,
        totalCount: _all.length,
      );
      _apply();
    } on Failure catch (_) {
      state = state.copyWith(isLoadingMore: false, hasMore: false);
    }
  }

  void setSort(SortOption option) {
    state = state.copyWith(sort: option);
    _apply();
  }

  void setPriceRange(RangeValues? range) {
    state = range == null
        ? state.copyWith(clearPriceRange: true)
        : state.copyWith(priceRange: range);
    _apply();
  }

  void toggleBrand(String brand) {
    final set = {...state.brandFilter};
    set.contains(brand) ? set.remove(brand) : set.add(brand);
    state = state.copyWith(brandFilter: set);
    _apply();
  }

  void setMinRating(int stars) {
    state = state.copyWith(minRating: stars);
    _apply();
  }

  void clearFilters() {
    state = state.copyWith(brandFilter: const {}, minRating: 0, clearPriceRange: true);
    _apply();
  }

  void _apply() {
    var list = _all.where((p) {
      if (state.priceRange != null &&
          (p.price < state.priceRange!.start || p.price > state.priceRange!.end)) {
        return false;
      }
      if (state.brandFilter.isNotEmpty && !state.brandFilter.contains(p.brand)) return false;
      if (state.minRating > 0 && (p.rating ?? 0) < state.minRating) return false;
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
        break;
    }
    state = state.copyWith(products: list);
  }
}
