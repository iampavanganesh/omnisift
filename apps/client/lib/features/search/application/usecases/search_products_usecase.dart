import '../../domain/entities/product.dart';
import '../../domain/repositories/search_repository.dart';

class SearchProductsUseCase {
  const SearchProductsUseCase(this._repo);
  final SearchRepository _repo;
  Future<({List<Product> products, bool hasMore})> call(String query, {int page = 0}) =>
      _repo.search(query, page: page);
}
