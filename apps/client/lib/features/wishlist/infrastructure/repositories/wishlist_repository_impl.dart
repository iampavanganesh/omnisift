import '../../domain/repositories/wishlist_repository.dart';
import '../datasources/wishlist_api_datasource.dart';

class WishlistRepositoryImpl implements WishlistRepository {
  WishlistRepositoryImpl(this._api);
  final WishlistApiDatasource _api;

  @override
  Future<WishlistListResult> list() => _api.list();

  @override
  Future<void> add(SaveWishlistInput input) => _api.add(input);

  @override
  Future<void> remove(String productId) => _api.remove(productId);

  @override
  Future<void> clearAll() => _api.clearAll();
}