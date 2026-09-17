import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';

class RegisterUseCase {
  const RegisterUseCase(this._repo);
  final AuthRepository _repo;
  Future<AuthSession> call({
    required String fullName,
    required String email,
    required String password,
  }) =>
      _repo.register(fullName: fullName, email: email, password: password);
}
