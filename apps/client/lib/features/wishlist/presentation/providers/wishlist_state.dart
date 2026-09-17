import '../../../../core/errors/failure.dart';
import '../../domain/entities/wishlist_item.dart';

class WishlistState {
  const WishlistState({
    this.items = const [],
    this.savedIds = const {},
    this.max = 30,
    this.loading = false,
    this.failure,
  });

  final List<WishlistItem> items;
  final Set<String> savedIds; // for quick heart state on cards
  final int max; // wishlist limit from Supabase (app_config.wishlist_max_items)
  final bool loading;
  final Failure? failure;

  bool isSaved(String productId) => savedIds.contains(productId);

  /// True when the user has hit the limit (count >= max).
  bool get isFull => items.length >= max;

  WishlistState copyWith({
    List<WishlistItem>? items,
    Set<String>? savedIds,
    int? max,
    bool? loading,
    Failure? failure,
  }) =>
      WishlistState(
        items: items ?? this.items,
        savedIds: savedIds ?? this.savedIds,
        max: max ?? this.max,
        loading: loading ?? this.loading,
        failure: failure,
      );
}