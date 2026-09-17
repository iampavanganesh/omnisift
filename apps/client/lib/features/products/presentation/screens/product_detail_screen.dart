import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/config/runtime_config_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../features/search/domain/entities/product.dart';
import '../../../../features/wishlist/presentation/providers/wishlist_controller.dart';
import '../../../../features/search/presentation/providers/search_controller.dart';
import '../../../../features/auth/presentation/providers/auth_controller.dart';
import '../../../../features/auth/presentation/providers/auth_state.dart';
import '../../../../features/affiliate/presentation/providers/affiliate_providers.dart';
import '../../domain/entities/comparison.dart';
import '../../domain/entities/seller.dart';
import '../providers/compare_by_product_provider.dart';
import '../providers/products_providers.dart';
import '../providers/recently_viewed_controller.dart';
import '../widgets/image_gallery.dart';
import '../widgets/omni_take_card.dart';
import '../widgets/reviews_section.dart';
import '../widgets/similar_products_section.dart';
import '../widgets/variant_siblings_section.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Product detail (mockup screen 06): image → title/rating → lowest price +
/// good-deal badge → price summary → available-at → specs, with a pinned
/// Set-Alert / Add-to-Wishlist action bar.
class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({required this.product, super.key});
  final Product product;

  /// Opens a product sourced from the real catalog (Category/Brand pages) —
  /// it has an internal id but no SerpAPI search token, so comparison data
  /// loads via [compareByProductProvider] instead of the token-keyed path.
  factory ProductDetailScreen.fromCatalog({
    required String productId,
    required String title,
    String? imageUrl,
    Key? key,
  }) =>
      ProductDetailScreen(
        key: key,
        product: Product(
          token: '',
          productId: productId,
          title: title,
          platform: '',
          price: 0,
          oldPrice: null,
          currency: 'INR',
          imageUrl: imageUrl ?? '',
          productUrl: '',
          rating: null,
          reviewCount: null,
          delivery: '',
        ),
      );

  bool get _hasToken => product.token.isNotEmpty;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Build the key once so rebuilds (wishlist toggle, etc.) reuse the same
    // provider instance instead of re-firing the comparison API.
    final comparisonKey = (token: product.token, productId: product.productId);
    final async = _hasToken
        ? ref.watch(comparisonProvider(comparisonKey))
        : ref.watch(compareByProductProvider(product.productId)).whenData((r) => r.comparison);
    final c = async.value;
    final saved = ref.watch(wishlistControllerProvider.select((s) => s.isSaved(product.productId)));
    final graphEnabled = ref.watch(priceGraphEnabledProvider).value ?? false;

    // When compare data arrives, patch this product's price in the search list
    // so returning to search shows the healed (cheapest) price — no reload, no API.
    void onCompareData(Comparison? data) {
      if (data == null) return;
      // Record this as viewed regardless of whether sellers loaded — the
      // product itself was successfully opened. Local-only, no backend.
      ref.read(recentlyViewedProvider.notifier).add(product);
      if (data.sellers.isEmpty) return;
      final cheapest = data.sellers
          .map((s) => s.price)
          .reduce((a, b) => a < b ? a : b);
      if (_hasToken) {
        ref.read(searchControllerProvider.notifier).patchProductPrice(
              product.productId,
              price: cheapest,
              rating: data.rating,
              reviewCount: data.reviewCount,
            );
      }
      // Reload the wishlist AFTER this frame so its (indexedStack-frozen) screen
      // rebuilds with the fresh price when the user navigates back. Calling it
      // synchronously here lands while that screen is asleep and gets missed.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(wishlistControllerProvider.notifier).load();
      });
    }

    if (_hasToken) {
      ref.listen(comparisonProvider(comparisonKey), (_, next) => onCompareData(next.value));
    } else {
      ref.listen(compareByProductProvider(product.productId),
          (_, next) => onCompareData(next.value?.comparison));
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Product details')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _errorView(),
        data: (c) => ListView(
          padding: EdgeInsets.zero,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              child: ImageGallery(images: c.images, fallback: product.imageUrl),
            ),
            _titleBlock(c),
            if (c.omni != null) OmniTakeCard(omni: c.omni!),
            if (c.sellers.isNotEmpty) ...[
              _lowestPrice(c),
              _priceSummary(c),
              _availableAt(context, ref, c),
              if (graphEnabled && c.productId != null) _graphButton(context, c.productId!),
            ],
            if (c.productId != null) VariantSiblingsSection(productId: c.productId!),
            if (c.specifications.isNotEmpty) _specs(c),
            if (c.reviews.isNotEmpty)
              ReviewsSection(ratingBreakdown: c.ratingBreakdown, reviews: c.reviews),
            if (c.productId != null) SimilarProductsSection(productId: c.productId!),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
      bottomNavigationBar: _actionBar(context, ref, saved, _savePrice(c, product), _saveSeller(c, product)),
    );
  }

  // --- sections ---

  Widget _titleBlock(Comparison c) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(c.title.isNotEmpty ? c.title : product.title, style: AppTypography.heading),
            if ((c.rating ?? product.rating) != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.success, borderRadius: AppRadius.all(AppRadius.sm)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Text('${c.rating ?? product.rating} ',
                        style: AppTypography.caption.copyWith(color: Colors.white)),
                    const Icon(Icons.star, size: 12, color: Colors.white),
                  ]),
                ),
                const SizedBox(width: AppSpacing.sm),
                if ((c.reviewCount ?? product.reviewCount) != null)
                  Text('(${c.reviewCount ?? product.reviewCount} reviews)', style: AppTypography.caption),
              ]),
            ],
          ],
        ),
      );

  Widget _lowestPrice(Comparison c) {
    final s = _summary(c);
    final pct = s.highest > 0 ? ((s.highest - s.lowest) / s.highest * 100).round() : 0;
    final goodDeal = pct >= 3;
    return _card(
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Lowest Price', style: AppTypography.caption),
              if (goodDeal)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12), borderRadius: AppRadius.all(AppRadius.sm)),
                  child: Text('Good Deal',
                      style: AppTypography.caption.copyWith(color: AppColors.success, fontWeight: FontWeight.w700)),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(_inr.format(s.lowest),
              style: AppTypography.display.copyWith(color: AppColors.primary)),
          if (pct > 0) ...[
            const SizedBox(height: 2),
            Text('You save ${_inr.format(s.highest - s.lowest)} ($pct%) vs highest',
                style: AppTypography.caption.copyWith(color: AppColors.success)),
          ],
        ],
      ),
    );
  }

  Widget _priceSummary(Comparison c) {
    final s = _summary(c);
    Widget cell(String label, double value, Color color) => Expanded(
          child: Column(children: [
            Text(label, style: AppTypography.caption),
            const SizedBox(height: 4),
            Text(_inr.format(value), style: AppTypography.body.copyWith(color: color, fontWeight: FontWeight.w700)),
          ]),
        );
    return _card(
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price Summary', style: AppTypography.title),
          const SizedBox(height: AppSpacing.md),
          Row(children: [
            cell('Highest', s.highest, AppColors.error),
            cell('Lowest', s.lowest, AppColors.success),
            cell('Average', s.average, AppColors.textPrimary),
          ]),
        ],
      ),
    );
  }

  Widget _availableAt(BuildContext context, WidgetRef ref, Comparison c) => _card(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Available at ${c.sellers.length} stores', style: AppTypography.title),
            const SizedBox(height: AppSpacing.sm),
            ...c.sellers
                .asMap()
                .entries
                .map((e) => _sellerRow(ref, c.productId, e.value, e.key == 0)),
          ],
        ),
      );

  Widget _graphButton(BuildContext context, String productId) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
        child: SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => context.push(
              '/price-graph',
              extra: (productId: productId, title: product.title),
            ),
            icon: const Icon(Icons.show_chart, size: 18),
            label: const Text('View price history'),
          ),
        ),
      );

  Widget _sellerRow(WidgetRef ref, String? internalProductId, Seller s, bool cheapest) => InkWell(
        onTap: () async {
          // Catalogued product: go through the backend-controlled redirect
          // (server resolves the real listing URL — never trust s.link
          // directly here) so this matches the same trust model as apps/web.
          // Pre-catalog (internalProductId null): no listing exists yet for
          // the backend to resolve, so there is no redirect endpoint that
          // could validate this — s.link is the only real destination that
          // exists, opened directly as a narrow, explicit exception.
          final uri = internalProductId != null
              ? Uri.parse(
                  '${AppConfig.apiBaseUrl}/affiliate/go/product/$internalProductId/platform/${Uri.encodeComponent(s.platform)}',
                )
              : Uri.tryParse(s.link);
          if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
          // Best-effort click logging — never blocks the outbound navigation
          // above, and only for logged-in users (the backend record requires
          // a user id; guests still browse/click freely, just unlogged).
          if (internalProductId != null &&
              ref.read(authControllerProvider).status == AuthStatus.authenticated) {
            unawaited(
              ref.read(recordAffiliateClickProvider)(
                productId: internalProductId,
                platform: s.platform,
              ).catchError((_) {}),
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Row(children: [
            Expanded(child: Text(s.platform, style: AppTypography.body)),
            if (cheapest)
              Container(
                margin: const EdgeInsets.only(right: AppSpacing.sm),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(4)),
                child: Text('Lowest', style: AppTypography.caption.copyWith(color: Colors.white)),
              ),
            Text(_inr.format(s.price),
                style: AppTypography.title.copyWith(
                    color: cheapest ? AppColors.success : AppColors.textPrimary)),
            Icon(Icons.chevron_right, color: AppColors.textDisabled),
          ]),
        ),
      );

  Widget _specs(Comparison c) => _card(
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Specifications', style: AppTypography.title),
            const SizedBox(height: AppSpacing.sm),
            ...c.specifications.map((sp) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SizedBox(width: 130, child: Text(sp.name, style: AppTypography.caption)),
                    Expanded(child: Text(sp.value, style: AppTypography.body)),
                  ]),
                )),
          ],
        ),
      );

  /// The price to freeze when saving: the compare lowest if compare has loaded,
  /// else the original search price. Prevents saving a stale pre-compare price.
  double _savePrice(Comparison? c, Product product) {
    if (c != null && c.sellers.isNotEmpty) {
      return c.sellers.map((s) => s.price).reduce((a, b) => a < b ? a : b);
    }
    return product.price;
  }

  /// The seller to attribute a wishlist save to: whichever seller in the
  /// loaded comparison is cheapest (matches [_savePrice]'s logic), so a
  /// catalog-sourced product (no single "original" seller) resolves sensibly
  /// too. Falls back to the product's own platform/link before compare loads.
  ({String platform, String productUrl}) _saveSeller(Comparison? c, Product product) {
    if (c != null && c.sellers.isNotEmpty) {
      final cheapest = c.sellers.reduce((a, b) => a.price < b.price ? a : b);
      return (platform: cheapest.platform, productUrl: cheapest.link);
    }
    return (platform: product.platform, productUrl: product.productUrl);
  }

  Widget _actionBar(
    BuildContext context,
    WidgetRef ref,
    bool saved,
    double savePrice,
    ({String platform, String productUrl}) saveSeller,
  ) =>
      SafeArea(
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              // Set Alert — outlined, on the left.
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _onSetAlert(context, ref, savePrice),
                  icon: const Icon(Icons.notifications_active_outlined, size: 18),
                  label: const Text('Set Alert'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              // Add to Wishlist — filled, on the right.
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => ref.read(wishlistControllerProvider.notifier).toggle(
                        productId: product.productId, token: product.token, title: product.title,
                        imageUrl: product.imageUrl, price: savePrice, platform: saveSeller.platform,
                        productUrl: saveSeller.productUrl,
                      ),
                  icon: Icon(saved ? Icons.favorite : Icons.favorite_border, size: 18),
                  label: Text(saved ? 'Saved' : 'Wishlist'),
                ),
              ),
            ],
          ),
        ),
      );

  /// Set-alert tap: gate guests to login, else open the alert sheet. Alerts need
  /// the INTERNAL product id, which only exists once compare has loaded.
  void _onSetAlert(BuildContext context, WidgetRef ref, double currentPrice) {
    final status = ref.read(authControllerProvider).status;
    if (status != AuthStatus.authenticated) {
      _promptLogin(context);
      return;
    }

    final comparisonKey = (token: product.token, productId: product.productId);
    final internalId = ref.read(comparisonProvider(comparisonKey)).value?.productId;
    if (internalId == null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(
          content: Text('Loading product… try again in a moment'),
          behavior: SnackBarBehavior.floating,
        ));
      return;
    }

    context.push(
      '/create-alert',
      extra: (
        productId: internalId,
        productTitle: product.title,
        productImageUrl: product.imageUrl,
        currentPrice: currentPrice,
      ),
    );
  }

  void _promptLogin(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Login required'),
        content: const Text('Log in to set price alerts and get notified on drops.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.go('/login');
            },
            child: const Text('Log in'),
          ),
        ],
      ),
    );
  }

  Widget _errorView() => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Text('No comparison available for this product yet.',
              textAlign: TextAlign.center, style: AppTypography.body),
        ),
      );

  Widget _card(Widget child) => Container(
        margin: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.all(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: child,
      );

  ({double lowest, double highest, double average}) _summary(Comparison c) {
    final prices = c.sellers.map((s) => s.price).toList()..sort();
    final total = prices.fold<double>(0, (a, b) => a + b);
    return (lowest: prices.first, highest: prices.last, average: total / prices.length);
  }
}