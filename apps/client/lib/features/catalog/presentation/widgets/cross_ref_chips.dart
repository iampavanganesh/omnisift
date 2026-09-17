import 'package:flutter/material.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/catalog_product.dart';

/// A labeled row of cross-reference chips (brands-in-category,
/// categories-for-brand, or sellers-for-brand) — real catalog cross-sections,
/// not a buried filter. Pass [onTap] to make chips navigable; omit it for a
/// display-only row (e.g. sellers, which have no browse page of their own).
class CrossRefChips extends StatelessWidget {
  const CrossRefChips({required this.title, required this.refs, this.onTap, super.key});
  final String title;
  final List<NamedRef> refs;
  final void Function(NamedRef ref)? onTap;

  @override
  Widget build(BuildContext context) {
    if (refs.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: AppSpacing.xs),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            children: refs
                .map((r) => onTap != null
                    ? ActionChip(
                        label: Text('${r.name} (${r.productCount})'),
                        onPressed: () => onTap!(r),
                      )
                    : Chip(label: Text('${r.name} (${r.productCount})')))
                .toList(),
          ),
        ],
      ),
    );
  }
}
