import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/omnisift_mark.dart';
import '../providers/auth_controller.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authControllerProvider.notifier).checkSession());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const OmnisiftMark(size: 96, onDark: true),
            const SizedBox(height: AppSpacing.xl),
            Text('OmniSift',
                style: AppTypography.display.copyWith(color: Colors.white)),
            const SizedBox(height: AppSpacing.sm),
            Text('Smarter Shopping, Better Savings',
                style: AppTypography.body.copyWith(color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}
