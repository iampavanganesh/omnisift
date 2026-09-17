import 'seller.dart';

class ProductSpec {
  const ProductSpec(this.name, this.value);
  final String name;
  final String value;
}

/// Deterministic "why buy this" explanation (ADR-0002) — every claim traces to
/// real data (price spread, discount, seller count), no model call involved.
class OmniReason {
  const OmniReason({required this.positive, required this.text});
  final bool positive;
  final String text;
}

class OmniTake {
  const OmniTake({required this.headline, required this.reasons});
  final String headline;
  final List<OmniReason> reasons;
}

class RatingBar {
  const RatingBar({required this.stars, required this.amount});
  final int stars;
  final int amount;
}

class ProductReview {
  const ProductReview({
    required this.title,
    required this.text,
    required this.userName,
    required this.source,
    required this.rating,
    required this.date,
  });
  final String title;
  final String text;
  final String userName;
  final String source;
  final double? rating;
  final String date;
}

class Comparison {
  const Comparison({
    required this.productId,        // ← NEW
    required this.title,
    required this.brand,
    required this.description,
    required this.rating,
    required this.reviewCount,
    required this.priceRange,
    required this.images,
    required this.specifications,
    required this.sellers,
    this.omni,
    this.ratingBreakdown = const [],
    this.reviews = const [],
  });
  final String? productId;          // ← NEW (internal UUID; null if unavailable)
  final String title;
  final String brand;
  final String description;
  final double? rating;
  final int? reviewCount;
  final String priceRange;
  final List<String> images;
  final List<ProductSpec> specifications;
  final List<Seller> sellers; // cheapest-first
  final OmniTake? omni;
  final List<RatingBar> ratingBreakdown;
  final List<ProductReview> reviews;
}