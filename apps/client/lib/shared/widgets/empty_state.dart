import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// Shared icon/heading/subtext pattern for any "nothing to show here" state —
/// empty lists, sign-in gates, filtered-to-nothing results. An optional
/// action (e.g. "Clear Filters") covers the filtered case; omit it for a
/// plain empty/gated state. Used across catalog, wishlist, alerts,
/// notifications, recently-viewed and click-history — mirrors the single
/// reusable EmptyState component on the web app.
class EmptyState extends StatelessWidget {
  const EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 64, color: AppColors.textDisabled),
              const SizedBox(height: AppSpacing.md),
              Text(title, style: AppTypography.title, textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.xs),
              Text(subtitle, style: AppTypography.body, textAlign: TextAlign.center),
              if (onAction != null) ...[
                const SizedBox(height: AppSpacing.lg),
                OutlinedButton(onPressed: onAction, child: Text(actionLabel ?? 'Retry')),
              ],
            ],
          ),
        ),
      );
}
