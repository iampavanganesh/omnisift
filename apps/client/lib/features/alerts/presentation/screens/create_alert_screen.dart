import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../providers/alerts_providers.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// Full-screen price-alert creation (mockup screen 10) — reached from Product
/// Detail's "Set Alert" button.
class CreateAlertScreen extends ConsumerStatefulWidget {
  const CreateAlertScreen({
    required this.productId,
    required this.productTitle,
    required this.productImageUrl,
    required this.currentPrice,
    super.key,
  });

  final String productId;
  final String productTitle;
  final String? productImageUrl;
  final double currentPrice;

  @override
  ConsumerState<CreateAlertScreen> createState() => _CreateAlertScreenState();
}

class _CreateAlertScreenState extends ConsumerState<CreateAlertScreen> {
  bool _belowTarget = true; // false = ANY_DROP
  final _priceCtrl = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final suggested = (widget.currentPrice * 0.95).roundToDouble();
    if (widget.currentPrice > 0) _priceCtrl.text = suggested.toInt().toString();
  }

  @override
  void dispose() {
    _priceCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _error = null;
      _saving = true;
    });

    double? target;
    if (_belowTarget) {
      target = double.tryParse(_priceCtrl.text.trim());
      if (target == null || target <= 0) {
        setState(() {
          _error = 'Enter a valid target price';
          _saving = false;
        });
        return;
      }
    }

    try {
      await ref.read(alertsControllerProvider.notifier).create(
            productId: widget.productId,
            type: _belowTarget ? 'BELOW_TARGET' : 'ANY_DROP',
            targetPrice: target,
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(
          content: Text('Alert set — we\'ll notify you on a price drop'),
          behavior: SnackBarBehavior.floating,
        ));
    } catch (e) {
      setState(() {
        _error = 'Could not set alert. Try again.';
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Create Price Alert')),
        body: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _productCard(),
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: AppRadius.all(AppRadius.lg),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Current Price', style: AppTypography.body.copyWith(color: AppColors.textSecondary)),
                  Text(_inr.format(widget.currentPrice),
                      style: AppTypography.title.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            _option(
              selected: _belowTarget,
              title: 'Alert me when price drops below',
              onTap: () => setState(() => _belowTarget = true),
            ),
            if (_belowTarget) ...[
              const SizedBox(height: AppSpacing.sm),
              TextField(
                controller: _priceCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  prefixText: '₹ ',
                  labelText: 'Target price',
                  border: const OutlineInputBorder(),
                  errorText: _belowTarget ? _error : null,
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            _option(
              selected: !_belowTarget,
              title: 'Notify me on any price drop',
              onTap: () => setState(() => _belowTarget = false),
            ),
            if (_error != null && !_belowTarget) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.error)),
            ],
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Create Alert'),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Center(
              child: Text(
                'You will be notified when the price drops below your target.',
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(color: AppColors.textDisabled),
              ),
            ),
          ],
        ),
      );

  Widget _productCard() => Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.all(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(children: [
          ClipRRect(
            borderRadius: AppRadius.all(AppRadius.md),
            child: Container(
              width: 56,
              height: 56,
              color: AppColors.background,
              child: widget.productImageUrl != null && widget.productImageUrl!.isNotEmpty
                  ? Image.network(widget.productImageUrl!, fit: BoxFit.contain)
                  : Icon(Icons.image_not_supported_outlined, color: AppColors.textDisabled),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(widget.productTitle,
                maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.body),
          ),
        ]),
      );

  Widget _option({required bool selected, required String title, required VoidCallback onTap}) => InkWell(
        onTap: onTap,
        borderRadius: AppRadius.all(AppRadius.md),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2 : 1),
            borderRadius: AppRadius.all(AppRadius.md),
          ),
          child: Row(children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: selected ? AppColors.primary : AppColors.textSecondary,
              size: 20,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: Text(title, style: AppTypography.body)),
          ]),
        ),
      );
}
