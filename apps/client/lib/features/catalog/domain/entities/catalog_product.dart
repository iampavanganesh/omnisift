/// One product row from a real catalog query (Category/Brand detail) — price
/// and discount are computed server-side from actual observed listings, not
/// a text-search guess.
class CatalogProduct {
  const CatalogProduct({
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
}

/// A named cross-reference with a count (brand-in-category, category-for-brand,
/// or seller-for-brand). [slug] is empty for sellers, which have no browse page.
class NamedRef {
  const NamedRef({
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
  /// Only populated for brand refs (real DB value, may be null — resolved
  /// further client-side by [BrandLogo]'s fallback chain).
  final String? logoUrl;
}

class CatalogInsights {
  const CatalogInsights({required this.productCount, required this.avgLowestPrice, required this.topDiscountPct});
  final int productCount;
  final double? avgLowestPrice;
  final int? topDiscountPct;
}

/// A real, data-driven filter facet — a spec key that actually repeats with
/// multiple distinct values across a category's real products right now.
/// Never a hardcoded per-category taxonomy; see backend
/// PrismaCategoryQueryRepository.getFacets.
class CategoryFacet {
  const CategoryFacet({required this.key, required this.values});
  final String key;
  final List<FacetValue> values;
}

class FacetValue {
  const FacetValue({required this.value, required this.count});
  final String value;
  final int count;
}

/// A REAL other product — a separately-scraped listing of the same base
/// model, differing only by its own distinct colour/storage/etc (see backend
/// PrismaProductQueryRepository.getVariantSiblings). Unlike a decorative
/// option chip, tapping this navigates to a real product with its own real
/// price. [isCurrent] marks the one being viewed. Never fabricated — empty
/// when no real duplicate listing exists yet, which is common today.
class VariantSibling {
  const VariantSibling({
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
}
