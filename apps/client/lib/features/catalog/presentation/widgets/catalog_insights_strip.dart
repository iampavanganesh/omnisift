import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/catalog_product.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// The thing a retailer's category/brand page can't honestly show: real
/// cross-seller price intelligence for everything tracked here.
class CatalogInsightsStrip extends StatelessWidget {
  const CatalogInsightsStrip({required this.insights, super.key});
  final CatalogInsights insights;

  @override
  Widget build(BuildContext context) {
    if (insights.productCount == 0) return const SizedBox.shrink();
    final parts = <String>['${insights.productCount} tracked'];
    if (insights.avgLowestPrice != null) {
      parts.add('avg ${_inr.format(insights.avgLowestPrice)}');
    }
    if (insights.topDiscountPct != null && insights.topDiscountPct! > 0) {
      parts.add('biggest drop ${insights.topDiscountPct}%');
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.06),
          borderRadius: AppRadius.all(AppRadius.md),
        ),
        child: Row(children: [
          Icon(Icons.insights, size: 18, color: AppColors.primary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(parts.join(' · '),
                style: AppTypography.caption.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
          ),
        ]),
      ),
    );
  }
}
