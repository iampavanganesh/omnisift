class WishlistItem {
  const WishlistItem({
    required this.id,
    required this.productId,
    required this.token,
    required this.title,
    required this.imageUrl,
    required this.price,
    required this.platform,
    required this.productUrl,
    this.currentPrice,
  });
  final String id;
  final String productId;
  final String token;
  final String title;
  final String imageUrl;
  final double price; // saved price (frozen at save time)
  final String platform;
  final String productUrl;
  final double? currentPrice; // live price from search_cache, null if unknown

  /// How much the price dropped since saving (positive = cheaper now).
  /// null when there's no current price or it didn't drop.
  double? get dropAmount {
    final cur = currentPrice;
    if (cur == null || cur >= price) return null;
    return price - cur;
  }

  /// How much the price rose since saving (positive = pricier now).
  /// null when there's no current price or it didn't rise.
  double? get riseAmount {
    final cur = currentPrice;
    if (cur == null || cur <= price) return null;
    return cur - price;
  }
}