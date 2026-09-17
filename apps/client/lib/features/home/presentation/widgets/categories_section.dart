import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../catalog/domain/entities/category.dart';
import '../../../catalog/presentation/providers/catalog_providers.dart';
import '../../../catalog/presentation/widgets/subcategory_map.dart';
import 'section_header.dart';

/// Home screen's "Shop by Category" row — real data (see backend
/// ProductsModule: populated only from products users have opened, grows
/// over time). Renders nothing while loading/errored/empty, same as before
/// this was extracted out of HomeScreen.build().
class CategoriesSection extends ConsumerWidget {
  const CategoriesSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(categoriesProvider);
    // The header is always shown (matches pre-extraction behavior — only the
    // horizontal list below reacts to loading/error/data).
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.lg),
        SectionHeader(
          'Shop by Category',
          action: TextButton(
            onPressed: () => context.push('/categories'),
            child: const Text('View All'),
          ),
        ),
        async.when(
          loading: () => const SizedBox(height: 84),
          error: (_, __) => const SizedBox.shrink(),
          data: (all) {
            final categories = all.where((c) => isUserFacingCategory(c.name)).toList();
            if (categories.isEmpty) return const SizedBox.shrink();
            return SizedBox(
              height: 84,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
                itemBuilder: (_, i) => _categoryTile(context, categories[i]),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _categoryTile(BuildContext context, Category c) => GestureDetector(
        onTap: () => context.push('/category', extra: (category: c, chip: null)),
        child: SizedBox(
          width: 72,
          child: Column(children: [
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
            Text(c.name, style: AppTypography.caption, maxLines: 1, overflow: TextOverflow.ellipsis),
          ]),
        ),
      );
}
