import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/catalog_product.dart';
import '../providers/catalog_listing_controller.dart';

final _inr =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Committed filter facets for the real (server-backed) catalog grid.
/// [brandSlugs] — not display names, since these become the backend's
/// `?brands=` slug list — only meaningful on the category screen (a brand
/// page is already scoped to one brand; see catalog_repository.dart).
/// [specs] — real, data-driven spec facets (key -> selected values), never a
/// hardcoded per-category taxonomy; see CategoryFacet.
typedef RealFilterState = ({
  double? minPrice,
  double? maxPrice,
  List<String> brandSlugs,
  double minRating,
  Map<String, Set<String>> specs,
});

const RealFilterState kEmptyRealFilters = (
  minPrice: null,
  maxPrice: null,
  brandSlugs: <String>[],
  minRating: 0.0,
  specs: <String, Set<String>>{},
);

/// Shared filter bottom sheet for Category and Brand listing screens.
///
/// The same price/brand/rating controls drive TWO independent filtered lists
/// at once: the "More to Explore" search-backfill grid (via
/// [catalogListingControllerProvider], applied instantly — cheap, it's just
/// an in-memory re-filter) and the real "Tracked Products" catalog grid
/// (applied only when "Show N results" is tapped, via [onApplyReal] — each
/// change there is a real HTTP request, so it's deferred rather than fired
/// per slider tick). No "Offers" checkboxes or Series/RAM filters — no
/// backing data exists for either.
Future<void> showCatalogFilterSheet(
  BuildContext context, {
  required String backfillKey,
  required RealFilterState real,
  required ValueChanged<RealFilterState> onApplyReal,
  required int realResultCount,
  List<NamedRef> realBrandOptions = const [],
  List<CategoryFacet> realFacetOptions = const [],
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) => _CatalogFilterSheetContent(
      sheetContext: sheetContext,
      backfillKey: backfillKey,
      real: real,
      onApplyReal: onApplyReal,
      realResultCount: realResultCount,
      realBrandOptions: realBrandOptions,
      realFacetOptions: realFacetOptions,
    ),
  );
}

class _CatalogFilterSheetContent extends ConsumerStatefulWidget {
  const _CatalogFilterSheetContent({
    required this.sheetContext,
    required this.backfillKey,
    required this.real,
    required this.onApplyReal,
    required this.realResultCount,
    required this.realBrandOptions,
    required this.realFacetOptions,
  });

  final BuildContext sheetContext;
  final String backfillKey;
  final RealFilterState real;
  final ValueChanged<RealFilterState> onApplyReal;
  final int realResultCount;
  final List<NamedRef> realBrandOptions;
  final List<CategoryFacet> realFacetOptions;

  @override
  ConsumerState<_CatalogFilterSheetContent> createState() =>
      _CatalogFilterSheetContentState();
}

class _CatalogFilterSheetContentState
    extends ConsumerState<_CatalogFilterSheetContent> {
  // A real instance field — unlike a local `var` inside a StatefulBuilder's
  // builder callback (which resets on every rebuild), this survives every
  // setState triggered by a slider drag or chip tap for the lifetime of the
  // sheet, so the accumulated selections actually reach "Show N results".
  late RealFilterState _draft = widget.real;

  void _update(RealFilterState next) => setState(() => _draft = next);

  @override
  Widget build(BuildContext context) {
    final ctrl =
        ref.read(catalogListingControllerProvider(widget.backfillKey).notifier);
    final backfillState =
        ref.watch(catalogListingControllerProvider(widget.backfillKey));
    final bounds = ctrl.priceBounds;
    final backfillBrands = ctrl.availableBrands;
    final hasPriceRange = bounds.max > bounds.min;
    final range = RangeValues(
        _draft.minPrice ?? bounds.min, _draft.maxPrice ?? bounds.max);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Filters', style: AppTypography.title),
                  TextButton(
                    onPressed: () {
                      ctrl.clearFilters();
                      _update(kEmptyRealFilters);
                    },
                    child: const Text('Clear all'),
                  ),
                ],
              ),
              if (hasPriceRange) ...[
                const SizedBox(height: AppSpacing.sm),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Price Range', style: AppTypography.caption),
                    Text(
                      '${_inr.format(range.start)} – ${_inr.format(range.end)}',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                RangeSlider(
                  values: range,
                  min: bounds.min,
                  max: bounds.max,
                  activeColor: AppColors.primary,
                  labels: RangeLabels(
                      _inr.format(range.start), _inr.format(range.end)),
                  onChanged: (v) {
                    ctrl.setPriceRange(v);
                    _update((
                      minPrice: v.start,
                      maxPrice: v.end,
                      brandSlugs: _draft.brandSlugs,
                      minRating: _draft.minRating,
                      specs: _draft.specs,
                    ));
                  },
                ),
              ],
              if (widget.realBrandOptions.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Text('Brands', style: AppTypography.caption),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: widget.realBrandOptions
                      .map((b) => FilterChip(
                            label: Text(b.name),
                            selected: _draft.brandSlugs.contains(b.slug),
                            selectedColor:
                                AppColors.primary.withValues(alpha: 0.12),
                            checkmarkColor: AppColors.primary,
                            onSelected: (sel) {
                              if (backfillBrands.contains(b.name))
                                ctrl.toggleBrand(b.name);
                              final slugs = [..._draft.brandSlugs];
                              sel ? slugs.add(b.slug) : slugs.remove(b.slug);
                              _update((
                                minPrice: _draft.minPrice,
                                maxPrice: _draft.maxPrice,
                                brandSlugs: slugs,
                                minRating: _draft.minRating,
                                specs: _draft.specs,
                              ));
                            },
                          ))
                      .toList(),
                ),
              ] else if (backfillBrands.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Text('Brands', style: AppTypography.caption),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: backfillBrands
                      .map((b) => FilterChip(
                            label: Text(b),
                            selected: backfillState.brandFilter.contains(b),
                            selectedColor:
                                AppColors.primary.withValues(alpha: 0.12),
                            checkmarkColor: AppColors.primary,
                            onSelected: (_) => ctrl.toggleBrand(b),
                          ))
                      .toList(),
                ),
              ],
              if (widget.realFacetOptions.isNotEmpty)
                for (final facet in widget.realFacetOptions) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(facet.key, style: AppTypography.caption),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: facet.values
                        .map((v) => FilterChip(
                              label: Text('${v.value} (${v.count})'),
                              selected: (_draft.specs[facet.key] ?? const {})
                                  .contains(v.value),
                              selectedColor:
                                  AppColors.primary.withValues(alpha: 0.12),
                              checkmarkColor: AppColors.primary,
                              onSelected: (sel) {
                                final specs = {
                                  for (final e in _draft.specs.entries)
                                    e.key: {...e.value},
                                };
                                final values =
                                    specs.putIfAbsent(facet.key, () => {});
                                sel
                                    ? values.add(v.value)
                                    : values.remove(v.value);
                                if (values.isEmpty) specs.remove(facet.key);
                                _update((
                                  minPrice: _draft.minPrice,
                                  maxPrice: _draft.maxPrice,
                                  brandSlugs: _draft.brandSlugs,
                                  minRating: _draft.minRating,
                                  specs: specs,
                                ));
                              },
                            ))
                        .toList(),
                  ),
                ],
              const SizedBox(height: AppSpacing.md),
              Text('Rating', style: AppTypography.caption),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                children: [4, 3, 2, 1]
                    .map((stars) => ChoiceChip(
                          label: Text('$stars★ & above'),
                          selected: _draft.minRating == stars,
                          selectedColor:
                              AppColors.primary.withValues(alpha: 0.12),
                          onSelected: (sel) {
                            ctrl.setMinRating(sel ? stars : 0);
                            _update((
                              minPrice: _draft.minPrice,
                              maxPrice: _draft.maxPrice,
                              brandSlugs: _draft.brandSlugs,
                              minRating: sel ? stars.toDouble() : 0.0,
                              specs: _draft.specs,
                            ));
                          },
                        ))
                    .toList(),
              ),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    widget.onApplyReal(_draft);
                    Navigator.pop(widget.sheetContext);
                  },
                  child: Text(
                    'Show ${widget.realResultCount + backfillState.products.length} results',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
