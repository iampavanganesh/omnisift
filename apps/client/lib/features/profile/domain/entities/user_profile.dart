class UserProfile {
  const UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phone,
    required this.profileCompleted,
  });
  final String id;
  final String email;
  final String? fullName;
  final String? phone;
  final bool profileCompleted;
}
