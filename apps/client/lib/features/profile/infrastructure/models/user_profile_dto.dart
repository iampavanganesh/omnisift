import '../../domain/entities/user_profile.dart';

class UserProfileDto {
  static UserProfile fromJson(Map<String, dynamic> j) => UserProfile(
        id: j['id'] as String? ?? '',
        email: j['email'] as String? ?? '',
        fullName: j['fullName'] as String?,
        phone: j['phone'] as String?,
        profileCompleted: j['profileCompleted'] as bool? ?? false,
      );
}
