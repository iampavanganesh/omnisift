import 'package:flutter/material.dart';

/// Semantic colors — light theme only (dark mode was a deliberate prior
/// decision, not a gap; see app_theme.dart).
abstract final class AppColors {
  static const Color primary = Color(0xFF4A2C17);
  static const Color primaryLight = Color(0xFF6B4429);
  // Warm terracotta — a second brand accent distinct from primary (brown) and
  // accent (gold), staying inside the same warm palette used for category/
  // brand hero hues on the web app (see apps/web/src/lib/accent-color.ts).
  // Was a literal blue (#1E88E5) — a direct violation of the frozen no-blue/
  // purple brand rule fixed on web in an earlier phase; fixed here to match.
  static const Color secondary = Color(0xFFB25D3A);

  // Gold accent from the logo mark (packages/design-system/tokens.json) —
  // used for borders/fills where contrast doesn't apply.
  static const Color accent = Color(0xFFE3A73A);
  // Darkened from #C98F26 (2.1:1 on white — fails WCAG's 3:1 non-text-contrast
  // minimum for icons/graphical objects) to #916A1D (4.9:1) — same fix as the
  // web app's --color-accent-dark. Use this, not accent, for anything that
  // needs to actually be seen clearly (icons, star ratings), not just fill.
  static const Color accentDark = Color(0xFF916A1D);

  // Semantic.
  static const Color success = Color(0xFF2E9E4B);
  static const Color warning = Color(0xFFED6C02);
  static const Color error = Color(0xFFE5484D);
  static const Color info = Color(0xFF0288D1);

  // Surfaces & text.
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE0E0E0);

  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF666666);
  // Darkened from #9E9E9E (2.6:1 on background — fails WCAG AA's 4.5:1) to
  // #707070 (4.7-5.0:1). Used for real content in places (timestamps, muted
  // labels), not just genuinely-disabled controls, which WCAG would exempt.
  static const Color textDisabled = Color(0xFF707070);
}
