import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:omnisift/core/theme/app_colors.dart';
import 'package:omnisift/core/theme/app_spacing.dart';
import 'package:omnisift/core/theme/app_typography.dart';
import 'package:omnisift/shared/validators/email_validator.dart';
import 'package:omnisift/shared/validators/password_validator.dart';
import 'package:omnisift/shared/widgets/primary_button.dart';
import 'package:omnisift/features/auth/presentation/providers/auth_controller.dart';
import 'package:omnisift/features/auth/presentation/providers/auth_state.dart';
import 'package:omnisift/features/auth/presentation/widgets/auth_text_field.dart';
import '../widgets/password_strength.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authControllerProvider.notifier).register(
          fullName: _name.text.trim(),
          email: _email.text.trim(),
          password: _password.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AuthTextField(
                  controller: _name,
                  label: 'Full name',
                  validator: (v) => validateRequired(v, 'Full name'),
                ),
                AuthTextField(
                  controller: _email,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: validateEmail,
                ),
                AuthTextField(
                  controller: _password,
                  label: 'Password',
                  obscure: true,
                  validator: validatePassword,
                  onChanged: (_) => setState(() {}),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                ),
                PasswordStrengthIndicator(password: _password.text),
                if (state.formStatus == FormStatus.failure && state.failure != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: Text(state.failure!.message,
                        style: AppTypography.caption.copyWith(color: AppColors.error),),
                  ),
                PrimaryButton(
                  label: 'Create account',
                  loading: state.isSubmitting,
                  onPressed: _submit,
                ),
                TextButton(
                  onPressed: () => context.push('/login'),
                  child: const Text('I already have an account'),
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                      child: Text('or', style: AppTypography.caption),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  onPressed: state.isSubmitting
                      ? null
                      : () => ref.read(authControllerProvider.notifier).signInWithGoogle(),
                  icon: const Icon(Icons.login),
                  label: const Text('Continue with Google'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
