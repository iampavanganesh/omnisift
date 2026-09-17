import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';

class GetProfileUseCase {
  const GetProfileUseCase(this._repo);
  final UserRepository _repo;
  Future<UserProfile> call() => _repo.me();
}

class UpdateProfileUseCase {
  const UpdateProfileUseCase(this._repo);
  final UserRepository _repo;
  Future<UserProfile> call({String? fullName, String? phone}) =>
      _repo.updateProfile(fullName: fullName, phone: phone);
}
