import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/seller.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class SellerRow extends StatelessWidget {
  const SellerRow({required this.seller, required this.isCheapest, super.key});
  final Seller seller;
  final bool isCheapest;

  Future<void> _open() async {
    final uri = Uri.tryParse(seller.link);
    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      title: Row(
        children: [
          Text(seller.platform, style: AppTypography.title),
          if (isCheapest) ...[
            const SizedBox(width: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(4)),
              child: Text('Lowest', style: AppTypography.caption.copyWith(color: Colors.white)),
            ),
          ],
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_inr.format(seller.price),
              style: AppTypography.title.copyWith(
                  color: isCheapest ? AppColors.success : AppColors.textPrimary)),
          const SizedBox(width: AppSpacing.sm),
          Icon(Icons.open_in_new, size: 18, color: AppColors.textSecondary),
        ],
      ),
      onTap: _open,
    );
  }
}
