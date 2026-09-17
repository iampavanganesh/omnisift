class CategoryDto {
  const CategoryDto({
    required this.id,
    required this.name,
    required this.slug,
    required this.productCount,
  });
  final String id;
  final String name;
  final String slug;
  final int productCount;

  factory CategoryDto.fromJson(Map<String, dynamic> j) => CategoryDto(
        id: j['id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        slug: j['slug'] as String? ?? '',
        productCount: (j['productCount'] as num?)?.toInt() ?? 0,
      );
}
