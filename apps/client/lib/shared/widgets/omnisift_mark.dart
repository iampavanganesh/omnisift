import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_colors.dart';

/// The app's brand mark (cart + price tag), reused across Splash / Onboarding /
/// Sign In / Home for a consistent brand moment.
///
/// Source of truth is packages/design-system/logo-mark-*.svg — these bundled
/// copies are mirrored by hand until a real asset pipeline exists (ADR-0003).
class OmnisiftMark extends StatelessWidget {
  const OmnisiftMark({this.size = 96, this.onDark = false, super.key});

  /// Overall footprint (width/height of the rounded square).
  final double size;

  /// True when painted on a dark background (Splash) — swaps the cart from
  /// brand-brown to cream so it stays visible; the gold tag is unchanged.
  final bool onDark;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        padding: EdgeInsets.all(size * 0.16),
        decoration: BoxDecoration(
          color: onDark ? Colors.white.withValues(alpha: 0.12) : AppColors.primary.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(size * 0.28),
        ),
        child: SvgPicture.asset(
          onDark
              ? 'assets/branding/logo-mark-dark.svg'
              : 'assets/branding/logo-mark-light.svg',
        ),
      );
}
