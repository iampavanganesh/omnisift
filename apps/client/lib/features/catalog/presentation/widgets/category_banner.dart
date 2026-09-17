import 'package:flutter/material.dart';
import '../../../../core/theme/app_radius.dart';
import '../../domain/entities/category.dart';
import 'subcategory_map.dart';

/// A richer, gradient variant of the category's already-established
/// [tintForCategory] — same hue as every other tile that already represents
/// this category (Shop by Category, All Categories sidebar), just deepened
/// for contrast on a hero. No new per-category palette, no fabricated imagery.
Color _categoryAccent(String name) {
  final hsl = HSLColor.fromColor(tintForCategory(name));
  return hsl
      .withSaturation((hsl.saturation + 0.35).clamp(0.0, 1.0))
      .withLightness((hsl.lightness - 0.25).clamp(0.0, 1.0))
      .toColor();
}

/// Generated category hero — mirrors [BrandBanner]'s visual language (gradient
/// + a white circle carrying the identifying glyph) so category and brand
/// storefront pages read as one consistent design system.
class CategoryBanner extends StatelessWidget {
  const CategoryBanner({required this.category, this.aspectRatio = 16 / 6, super.key});
  final Category category;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    final accent = _categoryAccent(category.name);
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
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.all(AppRadius.lg),
          ),
          child: Icon(iconForCategory(category.name), size: 40, color: accent),
        ),
      ),
    );
  }
}
