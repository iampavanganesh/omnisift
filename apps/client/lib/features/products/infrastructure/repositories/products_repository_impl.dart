import '../../domain/entities/comparison.dart';
import '../../../catalog/domain/entities/catalog_product.dart';
import '../../domain/repositories/products_repository.dart';
import '../datasources/products_api_datasource.dart';
import '../models/price_graph_dto.dart';

class ProductsRepositoryImpl implements ProductsRepository {
  ProductsRepositoryImpl(this._api);
  final ProductsApiDatasource _api;

  @override
  Future<Comparison> getComparison(String token, {String? productId}) async {
    final dto = await _api.getComparison(token, productId: productId);
    return dto.comparison;
  }

  @override
  Future<PriceGraphDto> getPriceGraph(String productId, int days) {
    return _api.getPriceGraph(productId, days);
  }

  @override
  Future<List<CatalogProduct>> getSimilarProducts(String productId, {int limit = 8}) async {
    final dtos = await _api.getSimilarProducts(productId, limit: limit);
    return dtos
        .map((d) => CatalogProduct(
              id: d.id,
              title: d.title,
              imageUrl: d.imageUrl,
              lowestPrice: d.lowestPrice,
              discountPct: d.discountPct,
              sellerCount: d.sellerCount,
            ))
        .toList();
  }

  @override
  Future<List<VariantSibling>> getVariantSiblings(String productId) async {
    final dtos = await _api.getVariantSiblings(productId);
    return dtos
        .map((d) => VariantSibling(
              id: d.id,
              slug: d.slug,
              title: d.title,
              imageUrl: d.imageUrl,
              label: d.label,
              lowestPrice: d.lowestPrice,
              isCurrent: d.isCurrent,
            ))
        .toList();
  }
}