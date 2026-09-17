import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/omnisift_mark.dart';
import '../../../search/presentation/providers/recent_searches_controller.dart';
import '../../../search/presentation/providers/search_controller.dart';
import '../../../notifications/presentation/providers/notifications_providers.dart';
import '../../../auth/presentation/providers/auth_controller.dart';
import '../../../auth/presentation/providers/auth_state.dart';
import '../widgets/categories_section.dart';
import '../widgets/deals_section.dart';
import '../widgets/most_searched_section.dart';
import '../widgets/section_header.dart';

class _Banner {
  const _Banner(this.title, this.subtitle, this.query, this.color, this.icons);
  final String title, subtitle, query;
  final Color color;
  final List<IconData> icons;
}

final _banners = [
  _Banner('Smarter Shopping,\nBetter Savings', 'Compare prices across every store in one place.',
      'iphone 15', AppColors.primary, [Icons.shopping_bag, Icons.local_offer, Icons.storefront]),
  _Banner('Latest Smartphones', 'Find the lowest price instantly.', 'smartphone', AppColors.secondary,
      [Icons.smartphone, Icons.bolt, Icons.trending_down]),
  _Banner('Deals on Electronics', 'Never overpay again.', 'laptop', AppColors.success,
      [Icons.laptop_mac, Icons.headphones, Icons.watch]),
];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _pageController = PageController();
  int _page = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authControllerProvider).status == AuthStatus.authenticated) {
        ref.read(notificationsControllerProvider.notifier).load();
      }
    });
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!_pageController.hasClients) return;
      _page = (_page + 1) % _banners.length;
      _pageController.animateToPage(_page,
          duration: const Duration(milliseconds: 450), curve: Curves.easeInOut);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _search(String q) {
    ref.read(searchControllerProvider.notifier).search(q);
    context.go('/search');
  }

  @override
  Widget build(BuildContext context) {
    final recent = ref.watch(recentSearchesProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: AppSpacing.lg,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const OmnisiftMark(size: 28),
            const SizedBox(width: AppSpacing.sm),
            const Text('OmniSift'),
          ],
        ),
        actions: [_bell(context)],
      ),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Search shortcut — tapping opens the Search tab, matching the
          // mockup's top search bar (the actual search UI lives on that tab).
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
            child: InkWell(
              borderRadius: AppRadius.all(AppRadius.md),
              onTap: () => context.go('/search'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: AppRadius.all(AppRadius.md),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(children: [
                  Icon(Icons.search, color: AppColors.textDisabled),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text('Search for products, brands and more…',
                        style: AppTypography.body.copyWith(color: AppColors.textDisabled)),
                  ),
                ]),
              ),
            ),
          ),

          // banner carousel
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 168,
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (i) => setState(() => _page = i),
              itemCount: _banners.length,
              itemBuilder: (_, i) => _banner(_banners[i]),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _banners.length,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _page ? 18 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == _page ? AppColors.primary : AppColors.border,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),

          // Shop by Category — real data (see backend ProductsModule:
          // populated only from products users have opened, grows over time).
          const CategoriesSection(),

          // recent (with product image)
          if (recent.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.lg),
            SectionHeader('Recent searches',
                action: TextButton(
                  onPressed: () => ref.read(recentSearchesProvider.notifier).clear(),
                  child: const Text('Clear'),
                )),
            SizedBox(
              height: 132,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: recent.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
                itemBuilder: (_, i) => _productTile(recent[i].query, recent[i].image, Icons.history),
              ),
            ),
          ],

          // Top Deals / Price Drops — real data (see backend `deals` module).
          // Sparse on a fresh install, grows as products are viewed.
          const DealsSection(),

          // Most Searched (last 24h) — real data, derived from logged search
          // analytics + cached search results (see backend
          // GET /discovery/most-searched). Sparse until enough searches have
          // happened in the window; hidden entirely rather than faked.
          const MostSearchedSection(),

          const SizedBox(height: AppSpacing.xl),
          _whyOmnisift(),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _bell(BuildContext context) {
    // Only logged-in users have notifications; guests see nothing.
    final loggedIn =
        ref.watch(authControllerProvider.select((s) => s.status)) == AuthStatus.authenticated;
    if (!loggedIn) return const SizedBox.shrink();

    final unread = ref.watch(notificationsControllerProvider.select((s) => s.unread));
    return IconButton(
      onPressed: () => context.push('/notifications'),
      tooltip: unread > 0 ? 'Notifications, $unread unread' : 'Notifications',
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          const Icon(Icons.notifications_none),
          if (unread > 0)
            Positioned(
              right: -4,
              top: -4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                child: Text(
                  unread > 9 ? '9+' : '$unread',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _whyOmnisift() {
    const items = [
      (Icons.price_check, 'Best Prices', 'Across Stores'),
      (Icons.verified_user_outlined, 'Trusted Stores', '100% Safe'),
      (Icons.show_chart, 'Price History', 'Track & Save'),
      (Icons.notifications_active_outlined, 'Smart Alerts', 'Never Miss a Deal'),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Row(
        children: items
            .map((it) => Expanded(
                  child: Column(
                    children: [
                      Icon(it.$1, color: AppColors.primary),
                      const SizedBox(height: AppSpacing.xs),
                      Text(it.$2,
                          style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
                          textAlign: TextAlign.center,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(it.$3,
                          style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                          textAlign: TextAlign.center,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _productTile(String label, String image, IconData icon) => GestureDetector(
        onTap: () => _search(label),
        child: SizedBox(
          width: 104,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            ClipRRect(
              borderRadius: AppRadius.all(AppRadius.md),
              child: CachedNetworkImage(
                imageUrl: image,
                width: 104, height: 96, fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Container(
                  width: 104, height: 96,
                  color: AppColors.primary.withValues(alpha: 0.08),
                  child: Icon(icon, color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(label, style: AppTypography.caption, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
      );

  // Flat icon-collage banner (no photos) — a floating cluster of related
  // icons over a solid brand color. Flat, not a gradient (design freeze rule:
  // no gradients as primary branding) — matches the flat accent-hue hero
  // bands used on the web app's category/brand pages.
  Widget _banner(_Banner b) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: GestureDetector(
          onTap: () => _search(b.query),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: AppRadius.all(AppRadius.lg),
              color: b.color,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -10, top: -10,
                  child: Icon(b.icons[0], size: 90, color: Colors.white.withValues(alpha: 0.12)),
                ),
                Positioned(
                  right: 50, bottom: -14,
                  child: Icon(b.icons[1], size: 56, color: Colors.white.withValues(alpha: 0.14)),
                ),
                Positioned(
                  right: 18, top: 34,
                  child: Icon(b.icons[2], size: 34, color: Colors.white.withValues(alpha: 0.18)),
                ),
                Positioned(
                  right: 90, top: -6,
                  child: Icon(Icons.star, size: 22, color: Colors.white.withValues(alpha: 0.16)),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(b.title,
                          style: AppTypography.heading.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                      const SizedBox(height: AppSpacing.xs),
                      Text(b.subtitle, style: AppTypography.body.copyWith(color: Colors.white70)),
                      const SizedBox(height: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.all(AppRadius.sm)),
                        child: Text('Explore Now',
                            style: AppTypography.caption.copyWith(color: b.color, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
