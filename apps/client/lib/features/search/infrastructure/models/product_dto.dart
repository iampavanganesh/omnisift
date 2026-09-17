/// Wire model — mirrors backend ProductResponseDto. Hand-written fromJson
/// (no codegen needed for this slice).
class ProductDto {
  const ProductDto({
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
  final String brand;
  final String category;

  factory ProductDto.fromJson(Map<String, dynamic> j) => ProductDto(
        token: j['token'] as String? ?? '',
        productId: j['productId'] as String? ?? '',
        title: j['title'] as String? ?? '',
        platform: j['platform'] as String? ?? '',
        price: (j['price'] as num?)?.toDouble() ?? 0,
        oldPrice: (j['oldPrice'] as num?)?.toDouble(),
        currency: j['currency'] as String? ?? 'INR',
        imageUrl: j['imageUrl'] as String? ?? '',
        productUrl: j['productUrl'] as String? ?? '',
        rating: (j['rating'] as num?)?.toDouble(),
        reviewCount: (j['reviewCount'] as num?)?.toInt(),
        delivery: j['delivery'] as String? ?? '',
        brand: j['brand'] as String? ?? '',
        category: j['category'] as String? ?? '',
      );
}
