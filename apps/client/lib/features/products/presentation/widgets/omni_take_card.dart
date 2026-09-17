import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/omnisift_mark.dart';
import '../../domain/entities/comparison.dart';

/// "Omni's Take" — a deterministic explanation card (ADR-0002). Every line
/// traces to real data (price spread, discount, seller count); there's no
/// model call behind this, which is deliberate — see the ADR.
class OmniTakeCard extends StatelessWidget {
  const OmniTakeCard({required this.omni, super.key});
  final OmniTake omni;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.accent.withValues(alpha: 0.08),
          borderRadius: AppRadius.all(AppRadius.lg),
          border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const OmnisiftMark(size: 28),
              const SizedBox(width: AppSpacing.sm),
              Text("Omni's Take", style: AppTypography.title),
            ]),
            const SizedBox(height: AppSpacing.sm),
            Text(omni.headline, style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: AppSpacing.sm),
            ...omni.reasons.map((r) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        r.positive ? Icons.check_circle : Icons.info_outline,
                        size: 16,
                        color: r.positive ? AppColors.success : AppColors.warning,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Expanded(child: Text(r.text, style: AppTypography.caption)),
                    ],
                  ),
                )),
          ],
        ),
      );
}
