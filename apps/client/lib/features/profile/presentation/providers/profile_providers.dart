import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../application/usecases/profile_usecases.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';
import '../../infrastructure/datasources/user_api_datasource.dart';
import '../../infrastructure/repositories/user_repository_impl.dart';

final _userApiProvider = Provider((ref) => UserApiDatasource(ref.watch(apiClientProvider)));
final userRepositoryProvider =
    Provider<UserRepository>((ref) => UserRepositoryImpl(ref.watch(_userApiProvider)));
final _getProfileUseCaseProvider =
    Provider((ref) => GetProfileUseCase(ref.watch(userRepositoryProvider)));
final updateProfileUseCaseProvider =
    Provider((ref) => UpdateProfileUseCase(ref.watch(userRepositoryProvider)));

/// The current user's profile.
final profileProvider = FutureProvider<UserProfile>(
  (ref) => ref.read(_getProfileUseCaseProvider)(),
);
