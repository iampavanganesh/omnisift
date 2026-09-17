import 'package:flutter/material.dart';
import '../../../../core/theme/app_radius.dart';
import '../../domain/entities/brand.dart';
import 'brand_logo.dart';

/// Deterministic hash-to-hue — no fabricated per-brand palette (there's no
/// real brand-color data anywhere in the catalog), just a stable gradient so
/// the same brand always renders the same way.
Color brandAccentColor(String name) {
  final hash = name.codeUnits.fold<int>(0, (h, c) => (h * 31 + c) & 0x7fffffff);
  final hue = (hash % 360).toDouble();
  return HSLColor.fromAHSL(1.0, hue, 0.55, 0.45).toColor();
}

/// Generated brand hero — a gradient derived from the brand's name plus its
/// real logo, replacing a fake "photo banner" nobody has real assets for.
class BrandBanner extends StatelessWidget {
  const BrandBanner({required this.brand, this.aspectRatio = 16 / 6, super.key});
  final Brand brand;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    final accent = brandAccentColor(brand.name);
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [accent.withValues(alpha: 0.85), accent.withValues(alpha: 0.45)],
          ),
        ),
        alignment: Alignment.center,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.all(AppRadius.lg),
          ),
          child: BrandLogo(brand: brand, size: 48),
        ),
      ),
    );
  }
}
