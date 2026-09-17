import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../../search/domain/entities/product.dart';
import '../../../search/presentation/providers/search_providers.dart';
import '../../domain/entities/brand.dart';
import '../../domain/entities/brand_detail.dart';
import '../../domain/entities/catalog_product.dart';
import '../../domain/entities/category.dart';
import '../../domain/entities/category_detail.dart';
import '../../domain/repositories/catalog_repository.dart';
import '../../infrastructure/datasources/catalog_api_datasource.dart';
import '../../infrastructure/repositories/catalog_repository_impl.dart';

final _catalogApiProvider = Provider((ref) => CatalogApiDatasource(ref.watch(apiClientProvider)));

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepositoryImpl(ref.watch(_catalogApiProvider)),
);

/// Catalog categories/brands, populated only from products users have already
/// opened (see backend `ProductsModule` docs) — sparse on a fresh install and
/// growing over time. An empty list is expected, not an error.
final categoriesProvider = FutureProvider<List<Category>>(
  (ref) => ref.watch(catalogRepositoryProvider).listCategories(),
);

final brandsProvider = FutureProvider<List<Brand>>(
  (ref) => ref.watch(catalogRepositoryProvider).listBrands(),
);

/// Filter-sheet facets for a category listing. [brandsKey] is a sorted,
/// comma-joined list of brand slugs — NOT a raw `List<String>`, because Dart
/// records use field equality and `List` doesn't override `==`, so a raw list
/// here would make every rebuild look like a new family key (breaking the
/// provider's caching, or worse, silently keeping a stale cache entry).
typedef CategoryDetailArgs = ({
  String slug,
  String sort,
  double? minPrice,
  double? maxPrice,
  String brandsKey,
  double minRating,
  /// Real, data-driven spec facets, canonicalized as sorted
  /// "key1:val1|val2,key2:val3" — same value-equality trick as [brandsKey].
  String specsKey,
});

/// Real catalog detail for one category — insights, brand cross-reference,
/// and a precise product grid (no text-search ambiguity possible, since it's
/// keyed by the resolved categoryId). Re-fetches page 0 whenever any arg changes.
final categoryDetailProvider = FutureProvider.family<CategoryDetail, CategoryDetailArgs>(
  (ref, args) => ref.watch(catalogRepositoryProvider).getCategoryDetail(
        args.slug,
        sort: args.sort,
        page: 0,
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        brands: args.brandsKey.isEmpty ? const [] : args.brandsKey.split(','),
        minRating: args.minRating,
        specs: parseSpecsKey(args.specsKey),
      ),
);

/// "key1:val1|val2,key2:val3" -> {key1: [val1, val2], key2: [val3]}.
Map<String, List<String>> parseSpecsKey(String specsKey) {
  if (specsKey.isEmpty) return const {};
  final result = <String, List<String>>{};
  for (final group in specsKey.split(',')) {
    final idx = group.indexOf(':');
    if (idx == -1) continue;
    final key = group.substring(0, idx);
    final values = group.substring(idx + 1).split('|').where((v) => v.isNotEmpty).toList();
    if (key.isNotEmpty && values.isNotEmpty) result[key] = values;
  }
  return result;
}

/// canonicalKey1:v1|v2,canonicalKey2:v3 — sorted so the same selection always
/// produces the same string regardless of insertion order (family-key safety).
String encodeSpecsKey(Map<String, Set<String>> specs) {
  final keys = specs.keys.where((k) => specs[k]!.isNotEmpty).toList()..sort();
  return keys.map((k) => '$k:${(specs[k]!.toList()..sort()).join('|')}').join(',');
}

/// Real, data-driven filter facets for one category — empty until it has
/// enough real products to filter on. Never hardcoded per category.
final categoryFacetsProvider = FutureProvider.family<List<CategoryFacet>, String>(
  (ref, categorySlug) => ref.watch(catalogRepositoryProvider).getCategoryFacets(categorySlug),
);

typedef BrandDetailArgs = ({
  String slug,
  String sort,
  String? category,
  double? minPrice,
  double? maxPrice,
  double minRating,
});

final brandDetailProvider = FutureProvider.family<BrandDetail, BrandDetailArgs>(
  (ref, args) => ref.watch(catalogRepositoryProvider).getBrandDetail(
        args.slug,
        sort: args.sort,
        page: 0,
        category: args.category,
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        minRating: args.minRating,
      ),
);

/// "Most searched in [category]" — real search-analytics signal, scoped to
/// one category (see backend `GET /discovery/most-searched/:category`).
final mostSearchedInCategoryProvider = FutureProvider.family<List<Product>, String>(
  (ref, categorySlug) =>
      ref.watch(searchRepositoryProvider).mostSearchedInCategory(categorySlug, limit: 1),
);
