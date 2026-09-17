import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/validators/password_validator.dart';

/// Live password feedback: a strength bar + a checklist of rules.
class PasswordStrengthIndicator extends StatelessWidget {
  const PasswordStrengthIndicator({required this.password, super.key});
  final String password;

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();

    final strength = passwordStrength(password);
    final rules = passwordRules(password);
    final (label, color, fill) = switch (strength) {
      PasswordStrength.strong => ('Strong', AppColors.success, 1.0),
      PasswordStrength.medium => ('Medium', AppColors.warning, 0.6),
      _ => ('Weak', AppColors.error, 0.3),
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fill,
                    minHeight: 6,
                    backgroundColor: AppColors.border,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(label, style: AppTypography.caption.copyWith(color: color)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ...rules.map(
            (r) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 1),
              child: Row(
                children: [
                  Icon(
                    r.met ? Icons.check_circle : Icons.radio_button_unchecked,
                    size: 16,
                    color: r.met ? AppColors.success : AppColors.textDisabled,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    r.label,
                    style: AppTypography.caption.copyWith(
                      color: r.met ? AppColors.textPrimary : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}