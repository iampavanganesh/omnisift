import '../entities/brand.dart';
import '../entities/brand_detail.dart';
import '../entities/catalog_product.dart';
import '../entities/category.dart';
import '../entities/category_detail.dart';

abstract class CatalogRepository {
  Future<List<Category>> listCategories();
  Future<List<Brand>> listBrands();

  /// [minPrice]/[maxPrice]/[brands]/[minRating]/[specs] are the filter-sheet
  /// facets — applied server-side on top of the real catalog grid. [specs] is
  /// key -> selected values (OR within a key, AND across keys).
  Future<CategoryDetail> getCategoryDetail(
    String slug, {
    required String sort,
    required int page,
    double? minPrice,
    double? maxPrice,
    List<String> brands = const [],
    double minRating = 0,
    Map<String, List<String>> specs = const {},
  });

  /// Real, data-driven filter facets for one category — empty until the
  /// category has enough real products to filter on. Never hardcoded.
  Future<List<CategoryFacet>> getCategoryFacets(String slug);

  /// [category] is an optional cross-filter slug — powers the Brand × Category
  /// page by reusing this same endpoint/response shape (ADR-0003), not a
  /// separate backend concept. No [brands] facet here — a brand's own page is
  /// already scoped to one brand, so a brand multi-select would be meaningless.
  Future<BrandDetail> getBrandDetail(
    String slug, {
    required String sort,
    required int page,
    String? category,
    double? minPrice,
    double? maxPrice,
    double minRating = 0,
  });
}
