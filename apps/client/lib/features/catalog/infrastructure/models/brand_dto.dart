class BrandDto {
  const BrandDto({
    required this.id,
    required this.name,
    required this.slug,
    required this.productCount,
    required this.logoUrl,
    required this.description,
  });
  final String id;
  final String name;
  final String slug;
  final int productCount;
  final String? logoUrl;
  final String? description;

  factory BrandDto.fromJson(Map<String, dynamic> j) => BrandDto(
        id: j['id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        slug: j['slug'] as String? ?? '',
        productCount: (j['productCount'] as num?)?.toInt() ?? 0,
        logoUrl: j['logoUrl'] as String?,
        description: j['description'] as String?,
      );
}
