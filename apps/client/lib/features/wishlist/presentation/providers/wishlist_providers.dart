import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../application/usecases/wishlist_usecases.dart';
import '../../domain/repositories/wishlist_repository.dart';
import '../../infrastructure/datasources/wishlist_api_datasource.dart';
import '../../infrastructure/repositories/wishlist_repository_impl.dart';

final _wishlistApiProvider = Provider(
  (ref) => WishlistApiDatasource(ref.watch(apiClientProvider)),
);
final wishlistRepositoryProvider = Provider<WishlistRepository>(
  (ref) => WishlistRepositoryImpl(ref.watch(_wishlistApiProvider)),
);
final getWishlistUseCaseProvider =
    Provider((ref) => GetWishlistUseCase(ref.watch(wishlistRepositoryProvider)));
final addToWishlistUseCaseProvider =
    Provider((ref) => AddToWishlistUseCase(ref.watch(wishlistRepositoryProvider)));
final removeFromWishlistUseCaseProvider =
    Provider((ref) => RemoveFromWishlistUseCase(ref.watch(wishlistRepositoryProvider)));
final clearWishlistUseCaseProvider =
    Provider((ref) => ClearWishlistUseCase(ref.watch(wishlistRepositoryProvider)));