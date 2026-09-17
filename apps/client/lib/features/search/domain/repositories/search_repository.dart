import '../entities/product.dart';

abstract interface class SearchRepository {
  /// `hasMore` is the backend's real page-ceiling signal (see
  /// search_api_datasource.dart) — never inferred from list emptiness.
  Future<({List<Product> products, bool hasMore})> search(String query, {int page});
  Future<List<String>> suggestions(String query);
  /// Real "most searched in the last [hours] hours" — see backend
  /// `GET /discovery/most-searched` (derived from logged search analytics +
  /// cached search results, never fabricated).
  Future<List<Product>> mostSearched({int hours, int limit});

  /// Same signal, scoped to one category (by slug) — see backend
  /// `GET /discovery/most-searched/:category`.
  Future<List<Product>> mostSearchedInCategory(String categorySlug, {int hours, int limit});
}
