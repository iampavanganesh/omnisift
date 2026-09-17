import '../../domain/entities/comparison.dart';
import '../../domain/entities/seller.dart';

/// Wire model — mirrors backend ComparisonResponseDto. Hand-written fromJson.
class ComparisonDto {
  const ComparisonDto(this.comparison);
  final Comparison comparison;

  factory ComparisonDto.fromJson(Map<String, dynamic> j) {
    final sellers = ((j['sellers'] as List?) ?? [])
        .cast<Map<String, dynamic>>()
        .map((s) => Seller(
              platform: s['platform'] as String? ?? '',
              price: (s['price'] as num?)?.toDouble() ?? 0,
              currency: s['currency'] as String? ?? 'INR',
              link: s['link'] as String? ?? '',
              logo: s['logo'] as String? ?? '',
            ))
        .toList();
    final specs = ((j['specifications'] as List?) ?? [])
        .cast<Map<String, dynamic>>()
        .map((s) => ProductSpec(s['name'] as String? ?? '', s['value'] as String? ?? ''))
        .toList();
    final omniJson = j['omni'] as Map<String, dynamic>?;
    final omni = omniJson == null
        ? null
        : OmniTake(
            headline: omniJson['headline'] as String? ?? '',
            reasons: ((omniJson['reasons'] as List?) ?? [])
                .cast<Map<String, dynamic>>()
                .map((r) => OmniReason(
                      positive: (r['tone'] as String?) == 'positive',
                      text: r['text'] as String? ?? '',
                    ))
                .toList(),
          );
    final ratingBreakdown = ((j['ratingBreakdown'] as List?) ?? [])
        .cast<Map<String, dynamic>>()
        .map((b) => RatingBar(
              stars: (b['stars'] as num?)?.toInt() ?? 0,
              amount: (b['amount'] as num?)?.toInt() ?? 0,
            ))
        .toList();
    final reviews = ((j['userReviews'] as List?) ?? [])
        .cast<Map<String, dynamic>>()
        .map((r) => ProductReview(
              title: r['title'] as String? ?? '',
              text: r['text'] as String? ?? '',
              userName: r['userName'] as String? ?? '',
              source: r['source'] as String? ?? '',
              rating: (r['rating'] as num?)?.toDouble(),
              date: r['date'] as String? ?? '',
            ))
        .toList();
    return ComparisonDto(Comparison(
      productId: j['productId'] as String?,
      title: j['title'] as String? ?? '',
      brand: j['brand'] as String? ?? '',
      description: j['description'] as String? ?? '',
      rating: (j['rating'] as num?)?.toDouble(),
      reviewCount: (j['reviewCount'] as num?)?.toInt(),
      priceRange: j['priceRange'] as String? ?? '',
      images: ((j['images'] as List?) ?? []).cast<String>(),
      specifications: specs,
      sellers: sellers,
      omni: omni,
      ratingBreakdown: ratingBreakdown,
      reviews: reviews,
    ));
  }
}
