import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../application/usecases/forgot_password_usecase.dart';
import '../../application/usecases/google_signin_usecase.dart';
import '../../application/usecases/login_usecase.dart';
import '../../application/usecases/logout_usecase.dart';
import '../../application/usecases/register_usecase.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../infrastructure/datasources/auth_api_datasource.dart';
import '../../infrastructure/datasources/google_auth_datasource.dart';
import '../../infrastructure/repositories/auth_repository_impl.dart';

// DI via Riverpod (no service locator).
final _authApiProvider = Provider(
  (ref) => AuthApiDatasource(ref.watch(apiClientProvider)),
);

final _googleAuthProvider = Provider((ref) => GoogleAuthDatasource());

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(
    ref.watch(_authApiProvider),
    ref.watch(_googleAuthProvider),
    ref.watch(secureStorageProvider),
  ),
);

final loginUseCaseProvider =
    Provider((ref) => LoginUseCase(ref.watch(authRepositoryProvider)));
final registerUseCaseProvider =
    Provider((ref) => RegisterUseCase(ref.watch(authRepositoryProvider)));
final logoutUseCaseProvider =
    Provider((ref) => LogoutUseCase(ref.watch(authRepositoryProvider)));
final forgotPasswordUseCaseProvider =
    Provider((ref) => ForgotPasswordUseCase(ref.watch(authRepositoryProvider)));
final googleSignInUseCaseProvider =
    Provider((ref) => GoogleSignInUseCase(ref.watch(authRepositoryProvider)));