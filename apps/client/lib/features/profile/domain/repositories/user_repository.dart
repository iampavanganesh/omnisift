import '../entities/user_profile.dart';

abstract interface class UserRepository {
  Future<UserProfile> me();
  Future<UserProfile> updateProfile({String? fullName, String? phone});
}
