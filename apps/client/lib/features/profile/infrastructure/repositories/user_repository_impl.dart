import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';
import '../datasources/user_api_datasource.dart';

class UserRepositoryImpl implements UserRepository {
  UserRepositoryImpl(this._api);
  final UserApiDatasource _api;

  @override
  Future<UserProfile> me() => _api.me();

  @override
  Future<UserProfile> updateProfile({String? fullName, String? phone}) =>
      _api.update(fullName: fullName, phone: phone);
}
