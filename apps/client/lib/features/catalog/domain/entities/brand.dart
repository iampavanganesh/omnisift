class Brand {
  const Brand({
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
  /// Only shown when non-null — never fabricated client-side.
  final String? logoUrl;
  final String? description;
}
