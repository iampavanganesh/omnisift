import 'package:flutter/material.dart';
import '../../../../core/errors/failure.dart';
import '../../../search/domain/entities/product.dart';
import '../../../search/presentation/providers/search_state.dart' show SortOption;

enum CatalogListingStatus { idle, loading, success, empty, error }

class CatalogListingState {
  const CatalogListingState({
    this.status = CatalogListingStatus.idle,
    this.products = const [],
    this.failure,
    this.sort = SortOption.relevance,
    this.priceRange,
    this.brandFilter = const {},
    this.minRating = 0, // 0 = no filter, else 1..4 stars & above
    this.totalCount = 0,
    this.currentPage = 0,
    this.isLoadingMore = false,
    this.hasMore = true,
  });

  final CatalogListingStatus status;
  final List<Product> products; // filtered + sorted
  final Failure? failure;
  final SortOption sort;
  final RangeValues? priceRange; // null = no filter applied
  final Set<String> brandFilter; // empty = all
  final int minRating;
  final int totalCount; // before filtering
  final int currentPage;
  final bool isLoadingMore;
  final bool hasMore;

  bool get hasActiveFilters => priceRange != null || brandFilter.isNotEmpty || minRating > 0;

  CatalogListingState copyWith({
    CatalogListingStatus? status,
    List<Product>? products,
    Failure? failure,
    SortOption? sort,
    RangeValues? priceRange,
    bool clearPriceRange = false,
    Set<String>? brandFilter,
    int? minRating,
    int? totalCount,
    int? currentPage,
    bool? isLoadingMore,
    bool? hasMore,
  }) =>
      CatalogListingState(
        status: status ?? this.status,
        products: products ?? this.products,
        failure: failure,
        sort: sort ?? this.sort,
        priceRange: clearPriceRange ? null : (priceRange ?? this.priceRange),
        brandFilter: brandFilter ?? this.brandFilter,
        minRating: minRating ?? this.minRating,
        totalCount: totalCount ?? this.totalCount,
        currentPage: currentPage ?? this.currentPage,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
      );
}
