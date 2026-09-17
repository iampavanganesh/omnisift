import '../../domain/entities/product.dart';
import '../../domain/repositories/search_repository.dart';
import '../datasources/search_api_datasource.dart';
import '../mappers/product_mapper.dart';

class SearchRepositoryImpl implements SearchRepository {
  SearchRepositoryImpl(this._api);
  final SearchApiDatasource _api;

  @override
  Future<({List<Product> products, bool hasMore})> search(String query, {int page = 0}) async {
    final result = await _api.search(query, page);
    return (
      products: result.products.map(productDtoToEntity).toList(),
      hasMore: result.hasMore,
    );
  }

  @override
  Future<List<String>> suggestions(String query) => _api.suggestions(query);

  @override
  Future<List<Product>> mostSearched({int hours = 24, int limit = 12}) async {
    final dtos = await _api.mostSearched(hours: hours, limit: limit);
    return dtos.map(productDtoToEntity).toList();
  }

  @override
  Future<List<Product>> mostSearchedInCategory(
    String categorySlug, {
    int hours = 24,
    int limit = 4,
  }) async {
    final dtos = await _api.mostSearchedInCategory(categorySlug, hours: hours, limit: limit);
    return dtos.map(productDtoToEntity).toList();
  }
}
