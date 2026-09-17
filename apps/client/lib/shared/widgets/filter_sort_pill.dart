import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// Small outlined/filled toggle pill (icon + label), tinted when [active].
/// Originally the search screen's private `_pill` — extracted so the catalog
/// listing screens can use the identical Filter/Sort control instead of a
/// duplicate implementation.
class FilterSortPill extends StatelessWidget {
  const FilterSortPill({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: AppRadius.all(AppRadius.lg),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
          decoration: BoxDecoration(
            color: active ? AppColors.primary.withValues(alpha: 0.08) : Colors.transparent,
            borderRadius: AppRadius.all(AppRadius.lg),
            border: Border.all(color: active ? AppColors.primary : AppColors.border),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 16, color: active ? AppColors.primary : AppColors.textSecondary),
            const SizedBox(width: 4),
            Text(label,
                style: AppTypography.caption.copyWith(
                    color: active ? AppColors.primary : AppColors.textSecondary,
                    fontWeight: FontWeight.w600)),
          ]),
        ),
      );
}
