import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../providers/catalog_providers.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../widgets/subcategory_map.dart';

class AllCategoriesScreen extends ConsumerWidget {
  const AllCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('All Categories')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => EmptyState(
          icon: Icons.error_outline,
          title: "Couldn't load categories",
          subtitle: 'Check your connection and try again.',
          onAction: () => ref.invalidate(categoriesProvider),
        ),
        data: (all) {
          final categories = all.where((c) => isUserFacingCategory(c.name)).toList();
          if (categories.isEmpty) {
            return const EmptyState(
              icon: Icons.category_outlined,
              title: 'No categories yet',
              subtitle: 'Browse a few products and categories will show up here.',
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(AppSpacing.lg),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 0.85,
            ),
            itemCount: categories.length,
            itemBuilder: (_, i) {
              final c = categories[i];
              return InkWell(
                borderRadius: AppRadius.all(AppRadius.md),
                onTap: () => context.push('/category', extra: (category: c, chip: null)),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: tintForCategory(c.name),
                        borderRadius: AppRadius.all(AppRadius.md),
                      ),
                      child: Icon(iconForCategory(c.name), color: AppColors.primary),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(c.name,
                        style: AppTypography.caption,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center),
                    Text('${c.productCount}',
                        style: AppTypography.caption.copyWith(color: AppColors.textDisabled)),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
