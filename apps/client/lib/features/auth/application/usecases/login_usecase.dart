import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';

class LoginUseCase {
  const LoginUseCase(this._repo);
  final AuthRepository _repo;
  Future<AuthSession> call({required String email, required String password}) =>
      _repo.login(email: email, password: password);
}
