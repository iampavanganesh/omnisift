import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../infrastructure/models/price_graph_dto.dart';
import '../providers/products_providers.dart';

const _ranges = <String, int>{'1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 1095};

const _seriesColors = <Color>[
  Color(0xFF2A78D6), // blue
  Color(0xFFEB6834), // orange
  Color(0xFF1BAF7A), // aqua
  Color(0xFFEDA100), // yellow
  Color(0xFFE87BA4), // magenta
  Color(0xFF6250D6), // violet
];

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _dateFmt = DateFormat('d MMM yyyy');

class PriceGraphScreen extends ConsumerStatefulWidget {
  const PriceGraphScreen({super.key, required this.productId, this.title = 'Price History'});
  final String productId;
  final String title;

  @override
  ConsumerState<PriceGraphScreen> createState() => _PriceGraphScreenState();
}

class _PriceGraphScreenState extends ConsumerState<PriceGraphScreen> {
  int _days = 90;
  String? _activeSellerId; // null = show all

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(
      priceGraphProvider((productId: widget.productId, days: _days)),
    );

    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _rangeChips(),
            const SizedBox(height: AppSpacing.md),
            Expanded(
              child: async.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Text('Could not load price history.',
                      textAlign: TextAlign.center, style: AppTypography.body),
                ),
                data: (graph) {
                  if (graph.series.isEmpty) {
                    return Center(
                      child: Text('No price history yet for this product.',
                          textAlign: TextAlign.center, style: AppTypography.body),
                    );
                  }
                  return SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _platformChips(graph),
                        const SizedBox(height: AppSpacing.lg),
                        SizedBox(height: 260, child: _chart(graph)),
                        const SizedBox(height: AppSpacing.lg),
                        _insights(graph),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<GraphPointDto> _shownPoints(PriceGraphDto graph) {
    final shown = _activeSellerId == null
        ? graph.series
        : graph.series.where((s) => s.sellerId == _activeSellerId).toList();
    return shown.expand((s) => s.points).toList();
  }

  Widget _insights(PriceGraphDto graph) {
    final points = _shownPoints(graph);
    if (points.isEmpty) return const SizedBox.shrink();
    final lowest = points.reduce((a, b) => a.price < b.price ? a : b);
    final highest = points.reduce((a, b) => a.price > b.price ? a : b);
    final average = points.map((p) => p.price).reduce((a, b) => a + b) / points.length;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.all(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price Insights', style: AppTypography.title),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              _insightCell('Lowest Price', lowest.price, lowest.capturedAt, AppColors.success),
              _insightCell('Highest Price', highest.price, highest.capturedAt, AppColors.error),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(height: 1),
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Average Price', style: AppTypography.body.copyWith(color: AppColors.textSecondary)),
              Text(_inr.format(average), style: AppTypography.title.copyWith(fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _insightCell(String label, double price, DateTime date, Color color) => Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.caption),
            const SizedBox(height: 2),
            Text(_inr.format(price),
                style: AppTypography.title.copyWith(color: color, fontWeight: FontWeight.w700)),
            Text('on ${_dateFmt.format(date)}',
                style: AppTypography.caption.copyWith(color: AppColors.textDisabled)),
          ],
        ),
      );

  Widget _rangeChips() {
    return Wrap(
      spacing: AppSpacing.sm,
      children: _ranges.entries.map((e) {
        final on = _days == e.value;
        return ChoiceChip(
          label: Text(e.key),
          selected: on,
          selectedColor: AppColors.primary.withValues(alpha: 0.12),
          labelStyle: TextStyle(color: on ? AppColors.primary : AppColors.textSecondary),
          onSelected: (_) => setState(() => _days = e.value),
        );
      }).toList(),
    );
  }

  Widget _platformChips(PriceGraphDto graph) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: 4,
      children: [
        ChoiceChip(
          label: const Text('All'),
          selected: _activeSellerId == null,
          selectedColor: AppColors.primary.withValues(alpha: 0.12),
          onSelected: (_) => setState(() => _activeSellerId = null),
        ),
        ...graph.series.asMap().entries.map((entry) {
          final s = entry.value;
          final color = _seriesColors[entry.key % _seriesColors.length];
          final on = _activeSellerId == s.sellerId;
          return ChoiceChip(
            avatar: CircleAvatar(backgroundColor: color, radius: 6),
            label: Text(s.sellerName),
            selected: on,
            selectedColor: AppColors.primary.withValues(alpha: 0.12),
            onSelected: (_) => setState(() => _activeSellerId = on ? null : s.sellerId),
          );
        }),
      ],
    );
  }

  Widget _chart(PriceGraphDto graph) {
    final shown = _activeSellerId == null
        ? graph.series
        : graph.series.where((s) => s.sellerId == _activeSellerId).toList();

    // x = day offset from the earliest point across all shown series.
    DateTime? minDate;
    for (final s in shown) {
      for (final p in s.points) {
        if (minDate == null || p.capturedAt.isBefore(minDate)) minDate = p.capturedAt;
      }
    }
    if (minDate == null) {
      return Center(child: Text('No data in this range.', style: AppTypography.body));
    }

    double dx(DateTime d) => d.difference(minDate!).inHours / 24.0;

    final lines = <LineChartBarData>[];
    for (var i = 0; i < shown.length; i++) {
      final s = shown[i];
      final color = _seriesColors[graph.series.indexOf(s) % _seriesColors.length];
      final spots = s.points.map((p) => FlSpot(dx(p.capturedAt), p.price)).toList()
        ..sort((a, b) => a.x.compareTo(b.x));
      lines.add(LineChartBarData(
        spots: spots,
        color: color,
        barWidth: 2.5,
        isCurved: false,
        dotData: const FlDotData(show: true),
      ));
    }

    return LineChart(
      LineChartData(
        lineBarsData: lines,
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touched) => touched.map((t) {
              return LineTooltipItem(
                _inr.format(t.y),
                const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
              );
            }).toList(),
          ),
        ),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 52,
              getTitlesWidget: (v, _) => Text(_inr.format(v),
                  style: AppTypography.caption.copyWith(fontSize: 10)),
            ),
          ),
          bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) {
          return FlLine(color: AppColors.border, strokeWidth: 1);
        }),
        borderData: FlBorderData(show: false),
      ),
    );
  }
}
