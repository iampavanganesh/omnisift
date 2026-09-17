import 'package:flutter/material.dart';

/// Design-system button. Build components before screens (Handbook Vol V).
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({required this.label, this.onPressed, this.loading = false, super.key});
  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: loading ? null : onPressed,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: loading
            ? const SizedBox(
                key: ValueKey('loader'),
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2))
            : Text(label, key: const ValueKey('label')),
      ),
    );
  }
}
