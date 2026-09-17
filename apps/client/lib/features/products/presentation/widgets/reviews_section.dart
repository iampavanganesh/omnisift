import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/comparison.dart';

/// Rating breakdown bars + written review list, captured from the provider
/// at acquisition time (see Product.ratingBreakdown/reviews on the backend) —
/// never fabricated, empty until a live comparison has populated them.
class ReviewsSection extends StatelessWidget {
  const ReviewsSection({required this.ratingBreakdown, required this.reviews, super.key});
  final List<RatingBar> ratingBreakdown;
  final List<ProductReview> reviews;

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) return const SizedBox.shrink();
    final total = ratingBreakdown.fold<int>(0, (a, b) => a + b.amount);
    final sorted = [...ratingBreakdown]..sort((a, b) => b.stars.compareTo(a.stars));

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Reviews', style: AppTypography.title),
          const SizedBox(height: AppSpacing.md),
          if (sorted.isNotEmpty) ...[
            ...sorted.map((bar) => _barRow(bar, total)),
            const SizedBox(height: AppSpacing.md),
          ],
          ...reviews.map(_reviewCard),
        ],
      ),
    );
  }

  Widget _barRow(RatingBar bar, int total) {
    final pct = total > 0 ? bar.amount / total : 0.0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 28, child: Text('${bar.stars}★', style: AppTypography.caption)),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 8,
                backgroundColor: AppColors.background,
                valueColor: AlwaysStoppedAnimation(AppColors.accentDark),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          SizedBox(
            width: 36,
            child: Text('${bar.amount}', textAlign: TextAlign.right, style: AppTypography.caption),
          ),
        ],
      ),
    );
  }

  Widget _reviewCard(ProductReview r) => Container(
        margin: const EdgeInsets.only(top: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.all(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(r.userName.isNotEmpty ? r.userName : 'Anonymous',
                      style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                ),
                if (r.rating != null)
                  Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.star, size: 14, color: AppColors.accentDark),
                    const SizedBox(width: 2),
                    Text('${r.rating}', style: AppTypography.caption),
                  ]),
              ],
            ),
            if (r.title.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(r.title, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
            ],
            const SizedBox(height: AppSpacing.xs),
            Text(r.text, style: AppTypography.caption),
            const SizedBox(height: AppSpacing.xs),
            Text(
              [r.source, if (r.date.isNotEmpty) r.date].join(' · '),
              style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
}
