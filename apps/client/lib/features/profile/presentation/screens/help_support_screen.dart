import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';

/// Static contact info — no live chat, nothing fabricated.
class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  Future<void> _emailUs() async {
    final uri = Uri(scheme: 'mailto', path: 'support@omnisift.app', query: 'subject=Omnisift support');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Help & Support')),
        body: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            Text('Need a hand?', style: AppTypography.title),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Reach out and we\'ll get back to you as soon as we can.',
              style: AppTypography.body,
            ),
            const SizedBox(height: AppSpacing.lg),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.border),
                borderRadius: AppRadius.all(AppRadius.lg),
              ),
              child: ListTile(
                leading: Icon(Icons.email_outlined, color: AppColors.primary),
                title: const Text('Email support'),
                subtitle: const Text('support@omnisift.app'),
                trailing: Icon(Icons.chevron_right, color: AppColors.textDisabled),
                onTap: _emailUs,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Common questions', style: AppTypography.title),
            const SizedBox(height: AppSpacing.sm),
            _faq('Why is a price different on the store\'s own site?',
                'Prices change frequently — we refresh listings regularly, but the store is always the source of truth at checkout.'),
            _faq('How do price alerts work?',
                'Set a target price (or "any drop") on a product\'s page. We check prices as they\'re observed and notify you when your condition is met.'),
            _faq('Do you sell anything directly?',
                'No — Omnisift compares prices across stores. Purchases always happen on the retailer\'s own site.'),
          ],
        ),
      );

  Widget _faq(String q, String a) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(q, style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(a, style: AppTypography.caption),
          ],
        ),
      );
}
