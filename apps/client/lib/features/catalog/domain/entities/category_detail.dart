import 'catalog_product.dart';

class CategoryDetail {
  const CategoryDetail({
    required this.id,
    required this.name,
    required this.slug,
    required this.insights,
    required this.brandsInCategory,
    this.topDeal,
    required this.products,
    required this.hasMore,
  });
  final String id;
  final String name;
  final String slug;
  final CatalogInsights insights;
  final List<NamedRef> brandsInCategory;
  /// The category's single biggest current discount, or null if nothing in
  /// it has a real discount right now — never fabricated.
  final CatalogProduct? topDeal;
  final List<CatalogProduct> products;
  final bool hasMore;
}
