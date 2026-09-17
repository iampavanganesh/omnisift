class CatalogProductDto {
  const CatalogProductDto({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.lowestPrice,
    required this.discountPct,
    required this.sellerCount,
  });
  final String id;
  final String title;
  final String? imageUrl;
  final double? lowestPrice;
  final int? discountPct;
  final int sellerCount;

  factory CatalogProductDto.fromJson(Map<String, dynamic> j) => CatalogProductDto(
        id: j['id'] as String? ?? '',
        title: j['title'] as String? ?? '',
        imageUrl: j['imageUrl'] as String?,
        lowestPrice: (j['lowestPrice'] as num?)?.toDouble(),
        discountPct: (j['discountPct'] as num?)?.toInt(),
        sellerCount: (j['sellerCount'] as num?)?.toInt() ?? 0,
      );
}

class VariantSiblingDto {
  const VariantSiblingDto({
    required this.id,
    required this.slug,
    required this.title,
    required this.imageUrl,
    required this.label,
    required this.lowestPrice,
    required this.isCurrent,
  });
  final String id;
  final String slug;
  final String title;
  final String? imageUrl;
  final String label;
  final double? lowestPrice;
  final bool isCurrent;

  factory VariantSiblingDto.fromJson(Map<String, dynamic> j) => VariantSiblingDto(
        id: j['id'] as String? ?? '',
        slug: j['slug'] as String? ?? '',
        title: j['title'] as String? ?? '',
        imageUrl: j['imageUrl'] as String?,
        label: j['label'] as String? ?? '',
        lowestPrice: (j['lowestPrice'] as num?)?.toDouble(),
        isCurrent: j['isCurrent'] as bool? ?? false,
      );
}

class NamedRefDto {
  const NamedRefDto({
    required this.id,
    required this.name,
    this.slug = '',
    required this.productCount,
    this.logoUrl,
  });
  final String id;
  final String name;
  final String slug;
  final int productCount;
  final String? logoUrl;

  factory NamedRefDto.fromJson(Map<String, dynamic> j) => NamedRefDto(
        id: j['id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        slug: j['slug'] as String? ?? '',
        productCount: (j['productCount'] as num?)?.toInt() ?? 0,
        logoUrl: j['logoUrl'] as String?,
      );
}

class FacetValueDto {
  const FacetValueDto({required this.value, required this.count});
  final String value;
  final int count;

  factory FacetValueDto.fromJson(Map<String, dynamic> j) => FacetValueDto(
        value: j['value'] as String? ?? '',
        count: (j['count'] as num?)?.toInt() ?? 0,
      );
}

class CategoryFacetDto {
  const CategoryFacetDto({required this.key, required this.values});
  final String key;
  final List<FacetValueDto> values;

  factory CategoryFacetDto.fromJson(Map<String, dynamic> j) => CategoryFacetDto(
        key: j['key'] as String? ?? '',
        values: (j['values'] as List).cast<Map<String, dynamic>>().map(FacetValueDto.fromJson).toList(),
      );
}

class CatalogInsightsDto {
  const CatalogInsightsDto({required this.productCount, required this.avgLowestPrice, required this.topDiscountPct});
  final int productCount;
  final double? avgLowestPrice;
  final int? topDiscountPct;

  factory CatalogInsightsDto.fromJson(Map<String, dynamic> j) => CatalogInsightsDto(
        productCount: (j['productCount'] as num?)?.toInt() ?? 0,
        avgLowestPrice: (j['avgLowestPrice'] as num?)?.toDouble(),
        topDiscountPct: (j['topDiscountPct'] as num?)?.toInt(),
      );
}

class CategoryDetailDto {
  const CategoryDetailDto({
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
  final CatalogInsightsDto insights;
  final List<NamedRefDto> brandsInCategory;
  final CatalogProductDto? topDeal;
  final List<CatalogProductDto> products;
  final bool hasMore;

  factory CategoryDetailDto.fromJson(Map<String, dynamic> j) {
    final category = j['category'] as Map<String, dynamic>;
    final topDeal = j['topDeal'] as Map<String, dynamic>?;
    return CategoryDetailDto(
      id: category['id'] as String? ?? '',
      name: category['name'] as String? ?? '',
      slug: category['slug'] as String? ?? '',
      insights: CatalogInsightsDto.fromJson(j['insights'] as Map<String, dynamic>),
      brandsInCategory: (j['brandsInCategory'] as List)
          .cast<Map<String, dynamic>>()
          .map(NamedRefDto.fromJson)
          .toList(),
      topDeal: topDeal != null ? CatalogProductDto.fromJson(topDeal) : null,
      products: (j['products'] as List).cast<Map<String, dynamic>>().map(CatalogProductDto.fromJson).toList(),
      hasMore: j['hasMore'] as bool? ?? false,
    );
  }
}

class BrandDetailDto {
  const BrandDetailDto({
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
  final CatalogInsightsDto insights;
  final List<NamedRefDto> categoriesForBrand;
  final List<NamedRefDto> sellersForBrand;
  final List<CatalogProductDto> products;
  final bool hasMore;

  factory BrandDetailDto.fromJson(Map<String, dynamic> j) {
    final brand = j['brand'] as Map<String, dynamic>;
    return BrandDetailDto(
      id: brand['id'] as String? ?? '',
      name: brand['name'] as String? ?? '',
      slug: brand['slug'] as String? ?? '',
      logoUrl: brand['logoUrl'] as String?,
      description: brand['description'] as String?,
      insights: CatalogInsightsDto.fromJson(j['insights'] as Map<String, dynamic>),
      categoriesForBrand: (j['categoriesForBrand'] as List)
          .cast<Map<String, dynamic>>()
          .map(NamedRefDto.fromJson)
          .toList(),
      sellersForBrand: (j['sellersForBrand'] as List)
          .cast<Map<String, dynamic>>()
          .map(NamedRefDto.fromJson)
          .toList(),
      products: (j['products'] as List).cast<Map<String, dynamic>>().map(CatalogProductDto.fromJson).toList(),
      hasMore: j['hasMore'] as bool? ?? false,
    );
  }
}
