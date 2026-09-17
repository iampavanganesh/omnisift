import '../entities/comparison.dart';
import '../../../catalog/domain/entities/catalog_product.dart';
import '../../infrastructure/models/price_graph_dto.dart';

abstract interface class ProductsRepository {
  Future<Comparison> getComparison(String token, {String? productId});
  Future<PriceGraphDto> getPriceGraph(String productId, int days);

  /// Other products from the same category (own catalog, never SerpAPI's
  /// "related products" — those carry no linkable id/slug). Empty when the
  /// product has no category or falls in the internal "Uncategorized" bucket.
  Future<List<CatalogProduct>> getSimilarProducts(String productId, {int limit});

  /// Real cross-listing variant siblings (see VariantSibling) — includes the
  /// product itself (isCurrent: true) plus any real other listings of the
  /// same base model. Empty when no real sibling exists, which is common today.
  Future<List<VariantSibling>> getVariantSiblings(String productId);
}