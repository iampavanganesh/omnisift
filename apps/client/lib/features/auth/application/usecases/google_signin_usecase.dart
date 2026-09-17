import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';

class GoogleSignInUseCase {
  const GoogleSignInUseCase(this._repo);
  final AuthRepository _repo;
  Future<AuthSession?> call() => _repo.googleSignIn();
}