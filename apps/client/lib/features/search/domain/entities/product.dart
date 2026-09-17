/// A product from search. `token` powers the detail/comparison fetch.
class Product {
  const Product({
    required this.token,
    required this.productId,
    required this.title,
    required this.platform,
    required this.price,
    required this.oldPrice,
    required this.currency,
    required this.imageUrl,
    required this.productUrl,
    required this.rating,
    required this.reviewCount,
    required this.delivery,
    this.brand = '',
    this.category = '',
  });

  final String token;
  final String productId;
  final String title;
  final String platform;
  final double price;
  final double? oldPrice;
  final String currency;
  final String imageUrl;
  final String productUrl;
  final double? rating;
  final int? reviewCount;
  final String delivery;
  /// Display-only, computed server-side from the title — used for brand filter chips.
  final String brand;
  /// Display-only, computed server-side from the title using the same fixed
  /// taxonomy as the real catalog — used for category filter chips.
  final String category;

  Product copyWith({
    String? token,
    String? productId,
    String? title,
    String? platform,
    double? price,
    double? oldPrice,
    String? currency,
    String? imageUrl,
    String? productUrl,
    double? rating,
    int? reviewCount,
    String? delivery,
    String? brand,
    String? category,
  }) =>
      Product(
        token: token ?? this.token,
        productId: productId ?? this.productId,
        title: title ?? this.title,
        platform: platform ?? this.platform,
        price: price ?? this.price,
        oldPrice: oldPrice ?? this.oldPrice,
        currency: currency ?? this.currency,
        imageUrl: imageUrl ?? this.imageUrl,
        productUrl: productUrl ?? this.productUrl,
        rating: rating ?? this.rating,
        reviewCount: reviewCount ?? this.reviewCount,
        delivery: delivery ?? this.delivery,
        brand: brand ?? this.brand,
        category: category ?? this.category,
      );
}