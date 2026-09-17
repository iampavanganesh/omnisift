import '../../infrastructure/models/price_graph_dto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../../catalog/domain/entities/catalog_product.dart';
import '../../application/usecases/get_comparison_usecase.dart';
import '../../domain/entities/comparison.dart';
import '../../domain/repositories/products_repository.dart';
import '../../infrastructure/datasources/products_api_datasource.dart';
import '../../infrastructure/repositories/products_repository_impl.dart';

final _productsApiProvider = Provider(
  (ref) => ProductsApiDatasource(ref.watch(apiClientProvider)),
);
final productsRepositoryProvider = Provider<ProductsRepository>(
  (ref) => ProductsRepositoryImpl(ref.watch(_productsApiProvider)),
);
final _getComparisonUseCaseProvider = Provider(
  (ref) => GetComparisonUseCase(ref.watch(productsRepositoryProvider)),
);

typedef ComparisonKey = ({String token, String productId});

/// Per-token in-memory cache of the comparison FUTURE. The same token always
/// returns the IDENTICAL Future object, so no matter how many times the widget
/// rebuilds or re-watches, the API is called EXACTLY ONCE per token. The result
/// (data OR error, e.g. a dead product's 404) is cached for the app session.
/// This is what physically enforces "1 tap = 1 API, no auto-refetch".
final _comparisonCache = <String, Future<Comparison>>{};

final comparisonProvider =
    FutureProvider.family<Comparison, ComparisonKey>(
  (ref, key) {
    final cached = _comparisonCache[key.token];
    if (cached != null) return cached;
    final future = ref
        .read(_getComparisonUseCaseProvider)(key.token, productId: key.productId);
    _comparisonCache[key.token] = future;
    return future;
  },
);
/// (productId, days) → the per-platform price graph. Cached by Riverpod per key,
/// so switching range refetches only when days actually changes.
typedef PriceGraphKey = ({String productId, int days});

final priceGraphProvider =
    FutureProvider.family<PriceGraphDto, PriceGraphKey>(
  (ref, key) {
    return ref
        .read(productsRepositoryProvider)
        .getPriceGraph(key.productId, key.days);
  },
);

/// Other products from the same category, shown at the end of Product Detail.
final similarProductsProvider =
    FutureProvider.family<List<CatalogProduct>, String>(
  (ref, productId) {
    return ref.read(productsRepositoryProvider).getSimilarProducts(productId);
  },
);

/// Real cross-listing variant siblings (same base model, different real SKU)
/// — empty when none exist, which is common today.
final variantSiblingsProvider =
    FutureProvider.family<List<VariantSibling>, String>(
  (ref, productId) {
    return ref.read(productsRepositoryProvider).getVariantSiblings(productId);
  },
);