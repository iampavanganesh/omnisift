import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Holds a catalog product id the user tried to save to their wishlist while
/// signed out (e.g. via a `/wishlist?add=<id>` deep link from the web app).
/// WishlistScreen sets this and sends the guest to /login; once auth succeeds
/// (email/password or Google), the router/login screen read and clear it to
/// resume the add instead of landing on the generic home screen.
class PendingWishlistAdd extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? productId) => state = productId;
}

final pendingWishlistAddProvider = NotifierProvider<PendingWishlistAdd, String?>(
  PendingWishlistAdd.new,
);
