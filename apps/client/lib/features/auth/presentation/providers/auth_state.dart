import '../../../../core/errors/failure.dart';
import '../../domain/entities/auth_session.dart';

/// Drives routing: are we signed in, signed out, or still checking?
enum AuthStatus { unknown, authenticated, unauthenticated }

/// Drives form UI: idle, submitting, or failed.
enum FormStatus { idle, submitting, failure }

class AuthState {
  const AuthState({
    required this.status,
    this.formStatus = FormStatus.idle,
    this.session,
    this.failure,
  });

  const AuthState.unknown() : this(status: AuthStatus.unknown);

  final AuthStatus status;
  final FormStatus formStatus;
  final AuthSession? session;
  final Failure? failure;

  bool get isSubmitting => formStatus == FormStatus.submitting;

  AuthState copyWith({
    AuthStatus? status,
    FormStatus? formStatus,
    AuthSession? session,
    Failure? failure,
  }) =>
      AuthState(
        status: status ?? this.status,
        formStatus: formStatus ?? this.formStatus,
        session: session ?? this.session,
        failure: failure,
      );
}
