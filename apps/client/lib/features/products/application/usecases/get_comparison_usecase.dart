import '../../domain/entities/comparison.dart';
import '../../domain/repositories/products_repository.dart';

class GetComparisonUseCase {
  const GetComparisonUseCase(this._repo);
  final ProductsRepository _repo;
  Future<Comparison> call(String token, {String? productId}) =>
      _repo.getComparison(token, productId: productId);
}
