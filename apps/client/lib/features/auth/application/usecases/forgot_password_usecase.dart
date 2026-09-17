import '../../domain/repositories/auth_repository.dart';

class ForgotPasswordUseCase {
  const ForgotPasswordUseCase(this._repo);
  final AuthRepository _repo;
  Future<void> call(String email) => _repo.forgotPassword(email);
}
