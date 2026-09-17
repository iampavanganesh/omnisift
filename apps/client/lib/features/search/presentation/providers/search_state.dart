import '../../../../core/errors/failure.dart';
import '../../domain/entities/product.dart';

enum SearchStatus { idle, loading, success, empty, error }

enum SortOption { relevance, priceLowHigh, priceHighLow, rating }

extension SortOptionLabel on SortOption {
  String get label => switch (this) {
        SortOption.relevance => 'Relevance',
        SortOption.priceLowHigh => 'Price: Low to High',
        SortOption.priceHighLow => 'Price: High to Low',
        SortOption.rating => 'Customer rating',
      };
}

class SearchState {
  const SearchState({
    this.status = SearchStatus.idle,
    this.products = const [],
    this.query = '',
    this.failure,
    this.sort = SortOption.relevance,
    this.platformFilter = const {},
    this.categoryFilter = const {},
    this.ratingFilter = false,
    this.totalCount = 0,
    this.currentPage = 0,
    this.isLoadingMore = false,
    this.hasMore = true,
  });

  final SearchStatus status;
  final List<Product> products; // displayed (filtered + sorted)
  final String query;
  final Failure? failure;
  final SortOption sort;
  final Set<String> platformFilter; // empty = all
  final Set<String> categoryFilter; // empty = all
  final bool ratingFilter; // 4★ & above only
  final int totalCount; // before filtering
  final int currentPage; // last loaded page (0-based)
  final bool isLoadingMore; // bottom spinner while next page loads
  final bool hasMore; // false once cap reached or a short page returns

  bool get hasActiveFilters =>
      platformFilter.isNotEmpty || categoryFilter.isNotEmpty || ratingFilter;

  SearchState copyWith({
    SearchStatus? status,
    List<Product>? products,
    String? query,
    Failure? failure,
    SortOption? sort,
    Set<String>? platformFilter,
    Set<String>? categoryFilter,
    bool? ratingFilter,
    int? totalCount,
    int? currentPage,
    bool? isLoadingMore,
    bool? hasMore,
  }) =>
      SearchState(
        status: status ?? this.status,
        products: products ?? this.products,
        query: query ?? this.query,
        failure: failure,
        sort: sort ?? this.sort,
        platformFilter: platformFilter ?? this.platformFilter,
        categoryFilter: categoryFilter ?? this.categoryFilter,
        ratingFilter: ratingFilter ?? this.ratingFilter,
        totalCount: totalCount ?? this.totalCount,
        currentPage: currentPage ?? this.currentPage,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
      );
}