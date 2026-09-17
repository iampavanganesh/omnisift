/// A currently-discounted product, sourced from live catalog prices.
class Deal {
  const Deal({
    required this.productId,
    required this.title,
    required this.imageUrl,
    required this.platform,
    required this.price,
    required this.mrp,
    required this.discountPct,
    required this.productUrl,
    required this.currency,
  });

  final String productId;
  final String title;
  final String? imageUrl;
  final String platform;
  final double price;
  final double? mrp;
  final int discountPct;
  final String productUrl;
  final String currency;
}
