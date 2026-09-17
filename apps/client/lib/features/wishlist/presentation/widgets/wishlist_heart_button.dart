import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../features/search/domain/entities/product.dart';
import '../providers/wishlist_controller.dart';

/// Heart toggle for a product. Filled when saved. Optimistic.
class WishlistHeartButton extends ConsumerWidget {
  const WishlistHeartButton({required this.product, this.filledBackground = false, super.key});
  final Product product;
  final bool filledBackground;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(
      wishlistControllerProvider.select((s) => s.isSaved(product.productId)),
    );
    final icon = Icon(
      saved ? Icons.favorite : Icons.favorite_border,
      color: saved ? AppColors.error : (filledBackground ? AppColors.textSecondary : AppColors.textSecondary),
    );

    Future<void> toggle() async {
      try {
        await ref.read(wishlistControllerProvider.notifier).toggle(
              productId: product.productId,
              token: product.token,
              title: product.title,
              imageUrl: product.imageUrl,
              price: product.price,
              platform: product.platform,
              productUrl: product.productUrl,
            );
      } catch (_) {
        // toggle() rethrows on failure. The common case is the wishlist being
        // full (backend returns 422). Show a clear message with the current max.
        if (!context.mounted) return;
        final max = ref.read(wishlistControllerProvider).max;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text('Wishlist full ($max). Remove one to add more.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
      }
    }

    final label = saved ? 'Remove from wishlist' : 'Add to wishlist';

    if (filledBackground) {
      return Material(
        color: AppColors.surface,
        shape: const CircleBorder(),
        elevation: 1,
        child: IconButton(icon: icon, onPressed: toggle, iconSize: 20, tooltip: label),
      );
    }
    return IconButton(icon: icon, onPressed: toggle, tooltip: label);
  }
}