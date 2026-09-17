import '../../domain/entities/brand.dart';
import '../../domain/entities/brand_detail.dart';
import '../../domain/entities/catalog_product.dart';
import '../../domain/entities/category.dart';
import '../../domain/entities/category_detail.dart';
import '../../domain/repositories/catalog_repository.dart';
import '../datasources/catalog_api_datasource.dart';
import '../models/catalog_detail_dto.dart';

class CatalogRepositoryImpl implements CatalogRepository {
  CatalogRepositoryImpl(this._api);
  final CatalogApiDatasource _api;

  @override
  Future<List<Category>> listCategories() async {
    final dtos = await _api.categories();
    return dtos
        .map((d) => Category(id: d.id, name: d.name, slug: d.slug, productCount: d.productCount))
        .toList();
  }

  @override
  Future<List<Brand>> listBrands() async {
    final dtos = await _api.brands();
    return dtos
        .map((d) => Brand(
              id: d.id,
              name: d.name,
              slug: d.slug,
              productCount: d.productCount,
              logoUrl: d.logoUrl,
              description: d.description,
            ))
        .toList();
  }

  @override
  Future<CategoryDetail> getCategoryDetail(
    String slug, {
    required String sort,
    required int page,
    double? minPrice,
    double? maxPrice,
    List<String> brands = const [],
    double minRating = 0,
    Map<String, List<String>> specs = const {},
  }) async {
    final d = await _api.categoryDetail(
      slug,
      sort: sort,
      page: page,
      minPrice: minPrice,
      maxPrice: maxPrice,
      brands: brands,
      minRating: minRating,
      specs: specs,
    );
    return CategoryDetail(
      id: d.id,
      name: d.name,
      slug: d.slug,
      insights: _insights(d.insights),
      brandsInCategory: d.brandsInCategory.map(_ref).toList(),
      topDeal: d.topDeal != null ? _product(d.topDeal!) : null,
      products: d.products.map(_product).toList(),
      hasMore: d.hasMore,
    );
  }

  @override
  Future<List<CategoryFacet>> getCategoryFacets(String slug) async {
    final dtos = await _api.categoryFacets(slug);
    return dtos
        .map((d) => CategoryFacet(
              key: d.key,
              values: d.values.map((v) => FacetValue(value: v.value, count: v.count)).toList(),
            ))
        .toList();
  }

  @override
  Future<BrandDetail> getBrandDetail(
    String slug, {
    required String sort,
    required int page,
    String? category,
    double? minPrice,
    double? maxPrice,
    double minRating = 0,
  }) async {
    final d = await _api.brandDetail(
      slug,
      sort: sort,
      page: page,
      category: category,
      minPrice: minPrice,
      maxPrice: maxPrice,
      minRating: minRating,
    );
    return BrandDetail(
      id: d.id,
      name: d.name,
      slug: d.slug,
      logoUrl: d.logoUrl,
      description: d.description,
      insights: _insights(d.insights),
      categoriesForBrand: d.categoriesForBrand.map(_ref).toList(),
      sellersForBrand: d.sellersForBrand.map(_ref).toList(),
      products: d.products.map(_product).toList(),
      hasMore: d.hasMore,
    );
  }

  CatalogInsights _insights(CatalogInsightsDto d) => CatalogInsights(
        productCount: d.productCount,
        avgLowestPrice: d.avgLowestPrice,
        topDiscountPct: d.topDiscountPct,
      );

  NamedRef _ref(NamedRefDto d) => NamedRef(
        id: d.id,
        name: d.name,
        slug: d.slug,
        productCount: d.productCount,
        logoUrl: d.logoUrl,
      );

  CatalogProduct _product(CatalogProductDto d) => CatalogProduct(
        id: d.id,
        title: d.title,
        imageUrl: d.imageUrl,
        lowestPrice: d.lowestPrice,
        discountPct: d.discountPct,
        sellerCount: d.sellerCount,
      );
}
