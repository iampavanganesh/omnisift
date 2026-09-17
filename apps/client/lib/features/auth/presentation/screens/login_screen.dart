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
import 'package:omnisift/features/wishlist/presentation/providers/pending_wishlist_add_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authControllerProvider.notifier).login(
          email: _email.text.trim(),
          password: _password.text,
        );
    // On success, go straight to home — the redirect alone doesn't reliably
    // push off the /login screen, so navigate explicitly here. Except: if a
    // guest got sent here from a /wishlist?add=<id> deep link, resume that
    // instead of dropping the intent (mirrors the same check in router.dart's
    // redirect, which covers the Google sign-in path that has no explicit
    // navigation of its own).
    if (!mounted) return;
    final status = ref.read(authControllerProvider).status;
    if (status == AuthStatus.authenticated) {
      final pendingAdd = ref.read(pendingWishlistAddProvider);
      if (pendingAdd != null) {
        ref.read(pendingWishlistAddProvider.notifier).set(null);
        context.go('/wishlist?add=$pendingAdd');
      } else {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Welcome Back!', style: AppTypography.display),
                const SizedBox(height: AppSpacing.xs),
                Text('Sign in to continue',
                    style: AppTypography.body.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: AppSpacing.xl),
                OutlinedButton.icon(
                  onPressed: state.isSubmitting
                      ? null
                      : () => ref.read(authControllerProvider.notifier).signInWithGoogle(),
                  icon: const Icon(Icons.g_mobiledata, size: 28),
                  label: const Text('Continue with Google'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                ),
                const SizedBox(height: AppSpacing.lg),
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
                const SizedBox(height: AppSpacing.lg),
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
                  validator: (v) => validateRequired(v, 'Password'),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                ),
                if (state.formStatus == FormStatus.failure && state.failure != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: Text(state.failure!.message,
                        style: AppTypography.caption.copyWith(color: AppColors.error)),
                  ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    child: const Text('Forgot password?'),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                PrimaryButton(label: 'Sign In', loading: state.isSubmitting, onPressed: _submit),
                const SizedBox(height: AppSpacing.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account? ",
                        style: AppTypography.body.copyWith(color: AppColors.textSecondary)),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                        minimumSize: const Size(0, 40),
                      ),
                      child: Text('Sign Up',
                          style: AppTypography.body.copyWith(
                              color: AppColors.primary, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
