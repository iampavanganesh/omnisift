import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/wishlist_item.dart';
import '../../domain/repositories/wishlist_repository.dart';
import 'wishlist_providers.dart';
import 'wishlist_state.dart';

final wishlistControllerProvider =
    NotifierProvider<WishlistController, WishlistState>(WishlistController.new);

class WishlistController extends Notifier<WishlistState> {
  @override
  WishlistState build() {
    Future.microtask(load);
    return const WishlistState(loading: true);
  }

  Future<void> load() async {
    state = state.copyWith(loading: true);
    try {
      final result = await ref.read(getWishlistUseCaseProvider)();
      state = WishlistState(
        items: result.items,
        savedIds: result.items.map((e) => e.productId).toSet(),
        max: result.max, // the Supabase limit → drives the count/max display
      );
    } on Failure catch (f) {
      state = state.copyWith(loading: false, failure: f);
    }
  }

  /// Toggle save/remove. Optimistic — reverts on failure (incl. limit reached).
  Future<void> toggle({
    required String productId,
    required String token,
    required String title,
    required String imageUrl,
    required double price,
    required String platform,
    required String productUrl,
  }) async {
    if (productId.isEmpty) return;
    final wasSaved = state.savedIds.contains(productId);
    final newIds = {...state.savedIds};
    List<WishlistItem> newItems = [...state.items];

    if (wasSaved) {
      newIds.remove(productId);
      newItems.removeWhere((e) => e.productId == productId);
    } else {
      newIds.add(productId);
      newItems = [
        WishlistItem(
          id: 'temp', productId: productId, token: token, title: title,
          imageUrl: imageUrl, price: price, platform: platform, productUrl: productUrl,
        ),
        ...newItems,
      ];
    }
    state = state.copyWith(items: newItems, savedIds: newIds); // optimistic

    try {
      if (wasSaved) {
        await ref.read(removeFromWishlistUseCaseProvider)(productId);
      } else {
        await ref.read(addToWishlistUseCaseProvider)(SaveWishlistInput(
          productId: productId, token: token, title: title, imageUrl: imageUrl,
          price: price, platform: platform, productUrl: productUrl,
        ));
      }
    } on Failure catch (f) {
      // Revert to server truth, and surface the reason (e.g. limit reached) so
      // the UI can show it. The backend returns a 422 BusinessRuleError when the
      // wishlist is full.
      await load();
      state = state.copyWith(failure: f);
      rethrow; // let the caller (heart button) show a message
    }
  }

  /// Remove every saved item (the "Clear all" action).
  Future<void> clearAll() async {
    final backup = state.items;
    state = state.copyWith(items: const [], savedIds: const {}); // optimistic
    try {
      await ref.read(clearWishlistUseCaseProvider)();
    } on Failure {
      // restore on failure
      state = state.copyWith(
        items: backup,
        savedIds: backup.map((e) => e.productId).toSet(),
      );
    }
  }
}