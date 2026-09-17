import '../entities/wishlist_item.dart';

class SaveWishlistInput {
  const SaveWishlistInput({
    required this.productId,
    required this.token,
    required this.title,
    required this.imageUrl,
    required this.price,
    required this.platform,
    required this.productUrl,
  });
  final String productId;
  final String token;
  final String title;
  final String imageUrl;
  final double price;
  final String platform;
  final String productUrl;
}

/// Items + the max limit (from Supabase) for the count/max display.
class WishlistListResult {
  const WishlistListResult({required this.items, required this.max});
  final List<WishlistItem> items;
  final int max;
}

abstract interface class WishlistRepository {
  Future<WishlistListResult> list();
  Future<void> add(SaveWishlistInput input);
  Future<void> remove(String productId);
  Future<void> clearAll();
}