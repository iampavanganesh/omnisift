import '../../domain/entities/wishlist_item.dart';

class WishlistItemDto {
  static WishlistItem fromJson(Map<String, dynamic> j) => WishlistItem(
        id: j['id'] as String? ?? '',
        productId: j['productId'] as String? ?? '',
        token: j['token'] as String? ?? '',
        title: j['title'] as String? ?? '',
        imageUrl: j['imageUrl'] as String? ?? '',
        price: (j['price'] as num?)?.toDouble() ?? 0,
        platform: j['platform'] as String? ?? '',
        productUrl: j['productUrl'] as String? ?? '',
        currentPrice: (j['currentPrice'] as num?)?.toDouble(),
      );
}