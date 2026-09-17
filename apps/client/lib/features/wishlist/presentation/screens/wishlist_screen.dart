import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../features/auth/presentation/providers/auth_controller.dart';
import '../../../../features/auth/presentation/providers/auth_state.dart';
import '../../../../features/products/presentation/providers/compare_by_product_provider.dart';
import '../../../../features/search/domain/entities/product.dart';
import '../../../../shared/loaders/skeleton_loader.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../domain/entities/wishlist_item.dart';
import '../providers/pending_wishlist_add_provider.dart';
import '../providers/wishlist_controller.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class WishlistScreen extends ConsumerStatefulWidget {
  const WishlistScreen({super.key});

  @override
  ConsumerState<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends ConsumerState<WishlistScreen> {
  bool _handledAddParam = false;

  @override
  void initState() {
    super.initState();
    // Reload every time the wishlist opens, so current prices / drops are
    // fresh — then, once we know what's already saved, handle a real
    // ?add=<productId> deep link (e.g. the web app's "Add to wishlist"
    // button) if one is present. savedIds must be loaded first so a repeat
    // visit to the same link shows "already saved" instead of re-toggling
    // (which would remove it).
    Future.microtask(() async {
      await ref.read(wishlistControllerProvider.notifier).load();
      if (mounted) _maybeHandleAddParam();
    });
  }

  void _maybeHandleAddParam() {
    if (_handledAddParam) return;
    final addId = GoRouterState.of(context).uri.queryParameters['add'];
    if (addId == null || addId.isEmpty) return;
    _handledAddParam = true;

    final authenticated = ref.read(authControllerProvider).status == AuthStatus.authenticated;
    if (!authenticated) {
      // Guests can browse/compare, but saving needs an account — capture the
      // intent and pick it back up once router.dart / login_screen.dart see
      // this resolved (see pendingWishlistAddProvider).
      ref.read(pendingWishlistAddProvider.notifier).set(addId);
      context.go('/login');
      return;
    }
    _addFromCatalogProductId(addId);
  }

  /// Resolves a catalog product id (the stable internal UUID, not a search
  /// token) into real seller data via the same compare-by-product lookup the
  /// in-app Compare screen uses, then saves its cheapest real listing —
  /// mirrors the "cheapest seller" logic already established on the web
  /// product page. Never fabricates a price/seller; if the product has no
  /// real listings there's nothing honest to save.
  Future<void> _addFromCatalogProductId(String productId) async {
    if (ref.read(wishlistControllerProvider).savedIds.contains(productId)) {
      _showSnack('Already in your wishlist.');
      return;
    }
    try {
      final result = await ref.read(compareByProductProvider(productId).future);
      final comparison = result.comparison;
      if (comparison.sellers.isEmpty) {
        _showSnack('This product has no listings to save yet.');
        return;
      }
      final cheapest = comparison.sellers.first; // Comparison.sellers is cheapest-first
      await ref.read(wishlistControllerProvider.notifier).toggle(
            productId: productId,
            token: '', // optional server-side (wishlist.schemas.ts defaults it to '')
            title: comparison.title,
            imageUrl: comparison.images.isNotEmpty ? comparison.images.first : '',
            price: cheapest.price,
            platform: cheapest.platform,
            productUrl: cheapest.link,
          );
      _showSnack('Added to your wishlist.');
    } catch (_) {
      _showSnack('Could not add this product — open it from its page and try again.');
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message), behavior: SnackBarBehavior.floating));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(wishlistControllerProvider);

    Widget body;
    if (state.loading && state.items.isEmpty) {
      body = ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: 5,
        itemBuilder: (_, __) => const SkeletonListCard(),
      );
    } else if (state.items.isEmpty) {
      body = const EmptyState(
        icon: Icons.favorite_border,
        title: 'No saved products yet',
        subtitle: 'Tap the ♡ on any product to save it.',
      );
    } else {
      body = Column(
        children: [
          // Thin "updating…" bar — shows while a refresh runs (e.g. returning
          // from compare) but the list is still visible. No full-screen spinner.
          if (state.loading)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.xs,
                horizontal: AppSpacing.lg,
              ),
              color: AppColors.primary.withValues(alpha: 0.08),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text('Updating prices…', style: AppTypography.caption),
                ],
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(wishlistControllerProvider.notifier).load(),
              child: ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: state.items.length,
                itemBuilder: (_, i) => _card(context, ref, state.items[i]),
              ),
            ),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Wishlist'),
        actions: [
          if (state.items.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: Center(
                child: Text(
                  '${state.items.length}/${state.max}',
                  style: AppTypography.caption.copyWith(
                    color: state.isFull ? AppColors.error : null,
                    fontWeight: state.isFull ? FontWeight.w700 : null,
                  ),
                ),
              ),
            ),
            IconButton(
              tooltip: 'Clear all',
              icon: const Icon(Icons.delete_sweep_outlined),
              onPressed: () => _confirmClearAll(context, ref),
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
        ],
      ),
      body: body,
    );
  }

  Future<void> _confirmClearAll(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear wishlist?'),
        content: const Text('This removes all saved products. This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Clear all', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(wishlistControllerProvider.notifier).clearAll();
    }
  }

  Widget _card(BuildContext context, WidgetRef ref, WishlistItem w) {
    // Saved price is frozen (w.price). Current price is live (w.currentPrice).
    final double saved = w.price;
    final double? current = w.currentPrice;
    final double? drop = w.dropAmount; // saved - current, only if dropped
    final double? rise = w.riseAmount; // current - saved, only if risen

    // Big price colour: green if cheaper, red if pricier, brand colour if same.
    final Color priceColor = drop != null
        ? AppColors.success
        : rise != null
            ? AppColors.error
            : AppColors.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.all(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      child: InkWell(
        onTap: () => context.push('/product', extra: _toProduct(w)),
        borderRadius: AppRadius.all(AppRadius.lg),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: AppRadius.all(AppRadius.md),
                child: Container(
                  color: AppColors.background,
                  padding: const EdgeInsets.all(4),
                  child: CachedNetworkImage(
                    imageUrl: w.imageUrl,
                    width: 72, height: 72, fit: BoxFit.contain,
                    errorWidget: (_, __, ___) => SizedBox(
                      width: 72, height: 72,
                      child: Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(w.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.body),
                    const SizedBox(height: AppSpacing.xs),

                    // PRICE ROW: current price big (colour-coded); if changed,
                    // show saved price struck through beside it.
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _inr.format(current ?? saved),
                          style: AppTypography.title.copyWith(
                            color: priceColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (drop != null || rise != null) ...[
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            _inr.format(saved),
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textDisabled,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        ],
                      ],
                    ),

                    // DROP BADGE: "↓ dropped ₹X since you saved" (green)
                    if (drop != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.12),
                          borderRadius: AppRadius.all(AppRadius.sm),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.arrow_downward, size: 12, color: AppColors.success),
                            const SizedBox(width: 2),
                            Text(
                              'Dropped ${_inr.format(drop)} since you saved',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.success, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // RISE BADGE: "↑ up ₹X since you saved" (red)
                    if (rise != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.12),
                          borderRadius: AppRadius.all(AppRadius.sm),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.arrow_upward, size: 12, color: AppColors.error),
                            const SizedBox(width: 2),
                            Text(
                              'Up ${_inr.format(rise)} since you saved',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.error, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: AppSpacing.xs),
                    if (w.platform.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.07),
                          borderRadius: AppRadius.all(AppRadius.sm),
                        ),
                        child: Text(w.platform,
                            style: AppTypography.caption.copyWith(color: AppColors.primary)),
                      ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.favorite, color: AppColors.error),
                tooltip: 'Remove from wishlist',
                onPressed: () => ref.read(wishlistControllerProvider.notifier).toggle(
                      productId: w.productId, token: w.token, title: w.title,
                      imageUrl: w.imageUrl, price: w.price, platform: w.platform,
                      productUrl: w.productUrl,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Product _toProduct(WishlistItem w) => Product(
        token: w.token, productId: w.productId, title: w.title, platform: w.platform,
        price: w.currentPrice ?? w.price, oldPrice: null, currency: 'INR', imageUrl: w.imageUrl,
        productUrl: w.productUrl, rating: null, reviewCount: null, delivery: '',
      );
}