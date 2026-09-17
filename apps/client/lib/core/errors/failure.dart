/// UI-facing failures. Mirrors the backend error taxonomy so screens can map
/// each to a friendly state. Data/logic layers return these, not raw exceptions.
sealed class Failure {
  const Failure(this.message);
  final String message;
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = "You're offline. Check your connection."]);
}
class AuthFailure extends Failure {
  const AuthFailure([super.message = 'Please sign in again.']);
}
class NotFoundFailure extends Failure {
  const NotFoundFailure([super.message = 'Not found.']);
}
class ProviderFailure extends Failure {
  const ProviderFailure([super.message = 'Showing the latest available data.']);
}
class ServerFailure extends Failure {
  const ServerFailure([super.message = 'Something went wrong. Please try again.']);
}
class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}
