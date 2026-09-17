import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:omnisift/core/errors/failure.dart';
import 'package:omnisift/features/auth/presentation/providers/auth_providers.dart';
import 'package:omnisift/features/auth/presentation/providers/auth_state.dart';
import 'package:omnisift/features/notifications/presentation/providers/push_providers.dart';

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

/// Holds auth state + drives all auth actions. Screens call these methods;
/// they never touch repositories or Dio directly.
class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState.unknown();

  /// Called on splash: decides the first screen.
  Future<void> checkSession() async {
    final session = await ref.read(authRepositoryProvider).currentSession();
    final authed = session != null;
    state = state.copyWith(
      status: authed ? AuthStatus.authenticated : AuthStatus.unauthenticated,
      session: session,
    );
    // Already-logged-in user (app reopen): make sure this device is registered.
    if (authed) {
      await ref.read(pushServiceProvider).registerForUser();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(formStatus: FormStatus.submitting);
    try {
      final session = await ref.read(loginUseCaseProvider)(email: email, password: password);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        formStatus: FormStatus.idle,
        session: session,
      );
      await ref.read(pushServiceProvider).registerForUser();
    } on Failure catch (f) {
      state = state.copyWith(formStatus: FormStatus.failure, failure: f);
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    state = state.copyWith(formStatus: FormStatus.submitting);
    try {
      final session = await ref
          .read(registerUseCaseProvider)(fullName: fullName, email: email, password: password);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        formStatus: FormStatus.idle,
        session: session,
      );
      await ref.read(pushServiceProvider).registerForUser();
    } on Failure catch (f) {
      state = state.copyWith(formStatus: FormStatus.failure, failure: f);
    }
  }

  Future<void> signInWithGoogle() async {
    state = state.copyWith(formStatus: FormStatus.submitting);
    try {
      final session = await ref.read(googleSignInUseCaseProvider)();
      if (session == null) {
        state = state.copyWith(formStatus: FormStatus.idle); // cancelled
        return;
      }
      state = state.copyWith(
        status: AuthStatus.authenticated,
        formStatus: FormStatus.idle,
        session: session,
      );
      await ref.read(pushServiceProvider).registerForUser();
    } on Failure catch (f) {
      state = state.copyWith(formStatus: FormStatus.failure, failure: f);
    }
  }

  Future<void> logout() async {
    // Unregister this device first (best-effort) so it stops getting pushes.
    await ref.read(pushServiceProvider).unregister();
    try {
      await ref.read(logoutUseCaseProvider)();
    } catch (_) {
      // Server logout is best-effort — always sign out locally regardless.
    }
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<Failure?> forgotPassword(String email) async {
    try {
      await ref.read(forgotPasswordUseCaseProvider)(email);
      return null;
    } on Failure catch (f) {
      return f;
    }
  }
}