import 'package:flutter/material.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';

/// A section title with an optional trailing action (e.g. "View All", "Clear")
/// — shared by every Home screen section (Shop by Category, Recent searches,
/// Top Deals, Most Searched).
class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {this.action, super.key});
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.sm, AppSpacing.sm),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [Text(title, style: AppTypography.title), if (action != null) action!],
        ),
      );
}
