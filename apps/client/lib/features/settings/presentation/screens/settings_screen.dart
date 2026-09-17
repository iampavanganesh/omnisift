import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../providers/settings_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  void _soon(BuildContext context, String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), duration: const Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(settingsProvider);
    final ctrl = ref.read(settingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          _section('Notifications'),
          SwitchListTile(
            secondary: const Icon(Icons.email_outlined),
            title: const Text('Email Notifications'),
            value: s.email,
            activeColor: AppColors.primary,
            onChanged: ctrl.setEmail,
          ),
          const Divider(),
          _section('About'),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About OmniSift'),
            trailing: Icon(Icons.chevron_right, color: AppColors.textDisabled),
            onTap: () => showAboutDialog(
              context: context,
              applicationName: 'OmniSift',
              applicationVersion: '1.0.0',
              applicationLegalese: 'Buy with Confidence.\nCompare prices across every store.',
            ),
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Terms & Conditions'),
            trailing: Icon(Icons.chevron_right, color: AppColors.textDisabled),
            onTap: () => _soon(context, 'Terms & Conditions coming soon'),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.sm),
        child: Text(title, style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700)),
      );
}
