import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../search/presentation/widgets/product_card.dart';
import '../providers/recently_viewed_controller.dart';

class RecentlyViewedScreen extends ConsumerWidget {
  const RecentlyViewedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(recentlyViewedProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recently Viewed'),
        actions: [
          if (items.isNotEmpty)
            IconButton(
              tooltip: 'Clear all',
              icon: const Icon(Icons.delete_sweep_outlined),
              onPressed: () => ref.read(recentlyViewedProvider.notifier).clear(),
            ),
        ],
      ),
      body: items.isEmpty
          ? const EmptyState(
              icon: Icons.history,
              title: 'No recently viewed products',
              subtitle: 'Products you view will show up here.',
            )
          : ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.lg),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final p = items[i];
                return ProductCard(product: p, onTap: () => context.push('/product', extra: p));
              },
            ),
    );
  }
}
