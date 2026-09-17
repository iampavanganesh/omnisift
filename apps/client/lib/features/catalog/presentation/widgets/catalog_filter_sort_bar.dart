import 'package:flutter/material.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/filter_sort_pill.dart';

/// Result-count label + Sort/Filter pills, replacing the old plain
/// [DropdownButton] sort control and the single AppBar filter icon.
class CatalogFilterSortBar extends StatelessWidget {
  const CatalogFilterSortBar({
    required this.resultCount,
    required this.sortActive,
    required this.filterActive,
    required this.onSort,
    required this.onFilter,
    super.key,
  });

  final int resultCount;
  final bool sortActive;
  final bool filterActive;
  final VoidCallback onSort;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.sm),
        child: Row(
          children: [
            Text('$resultCount product${resultCount == 1 ? '' : 's'}', style: AppTypography.caption),
            const Spacer(),
            FilterSortPill(
              icon: Icons.filter_list,
              label: 'Filter',
              active: filterActive,
              onTap: onFilter,
            ),
            const SizedBox(width: AppSpacing.sm),
            FilterSortPill(
              icon: Icons.swap_vert,
              label: 'Sort',
              active: sortActive,
              onTap: onSort,
            ),
          ],
        ),
      );
}
