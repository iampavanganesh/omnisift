import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:omnisift/core/theme/app_colors.dart';
import 'package:omnisift/core/theme/app_spacing.dart';
import 'package:omnisift/core/theme/app_typography.dart';
import 'package:omnisift/shared/widgets/omnisift_mark.dart';
import 'package:omnisift/shared/widgets/primary_button.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),
              Center(
                child: SizedBox(
                  width: 160,
                  height: 160,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const OmnisiftMark(size: 120),
                      Positioned(
                        left: 4,
                        top: 8,
                        child: _badge(Icons.local_offer, AppColors.success),
                      ),
                      Positioned(
                        right: 0,
                        bottom: 12,
                        child: _badge(Icons.shopping_cart, AppColors.secondary),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text('Find the Best Prices\nAcross All Stores',
                  textAlign: TextAlign.center, style: AppTypography.heading),
              const SizedBox(height: AppSpacing.sm),
              Text('Compare prices, track price drops,\nand shop at the best time.',
                  textAlign: TextAlign.center,
                  style: AppTypography.body.copyWith(color: AppColors.textSecondary)),
              const Spacer(flex: 3),
              PrimaryButton(label: 'Get Started', onPressed: () => context.push('/register')),
              const SizedBox(height: AppSpacing.md),
              Center(
                child: TextButton(
                  onPressed: () => context.push('/login'),
                  child: RichText(
                    text: TextSpan(
                      style: AppTypography.body.copyWith(color: AppColors.textSecondary),
                      children: [
                        const TextSpan(text: 'Already have an account? '),
                        TextSpan(
                          text: 'Sign in',
                          style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(IconData icon, Color color) => Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
        ),
        child: Icon(icon, size: 18, color: Colors.white),
      );
}
