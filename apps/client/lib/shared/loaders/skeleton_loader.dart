import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';

/// Skeleton block — show structure before data (never full-screen spinners).
/// Pulses gently, mirroring the web app's `@keyframes skeleton-pulse`.
class SkeletonBox extends StatefulWidget {
  const SkeletonBox({this.height = 16, this.width = double.infinity, this.borderRadius, super.key});
  final double height;
  final double width;
  final BorderRadius? borderRadius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);
  late final Animation<double> _opacity = Tween<double>(begin: 0.5, end: 1.0).animate(
    CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
        opacity: _opacity,
        child: Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: widget.borderRadius ?? AppRadius.all(AppRadius.sm),
          ),
        ),
      );
}

/// Skeleton for a simple ListTile row (circular leading + title + subtitle) —
/// matches Alerts/Notifications' real row shape.
class SkeletonListTile extends StatelessWidget {
  const SkeletonListTile({super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
        child: Row(
          children: [
            const SkeletonBox(width: 40, height: 40, borderRadius: BorderRadius.all(Radius.circular(20))),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(height: 14, width: 180),
                  SizedBox(height: AppSpacing.xs),
                  SkeletonBox(height: 12, width: 110),
                ],
              ),
            ),
          ],
        ),
      );
}

/// Skeleton for a bordered row-card (image block + a few lines) — matches
/// Wishlist/RecentlyViewed/ClickHistory's real card shape.
class SkeletonListCard extends StatelessWidget {
  const SkeletonListCard({super.key});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.all(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SkeletonBox(width: 64, height: 64, borderRadius: AppRadius.all(AppRadius.md)),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(height: 14, width: double.infinity),
                  SizedBox(height: AppSpacing.xs),
                  SkeletonBox(height: 14, width: 120),
                  SizedBox(height: AppSpacing.sm),
                  SkeletonBox(height: 12, width: 80),
                ],
              ),
            ),
          ],
        ),
      );
}
