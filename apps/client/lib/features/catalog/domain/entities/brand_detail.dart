import 'catalog_product.dart';

class BrandDetail {
  const BrandDetail({
    required this.id,
    required this.name,
    required this.slug,
    required this.logoUrl,
    required this.description,
    required this.insights,
    required this.categoriesForBrand,
    required this.sellersForBrand,
    required this.products,
    required this.hasMore,
  });
  final String id;
  final String name;
  final String slug;
  final String? logoUrl;
  final String? description;
  final CatalogInsights insights;
  final List<NamedRef> categoriesForBrand;
  final List<NamedRef> sellersForBrand;
  final List<CatalogProduct> products;
  final bool hasMore;
}
