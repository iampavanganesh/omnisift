import '../../domain/repositories/wishlist_repository.dart';

class GetWishlistUseCase {
  const GetWishlistUseCase(this._repo);
  final WishlistRepository _repo;
  Future<WishlistListResult> call() => _repo.list();
}

class AddToWishlistUseCase {
  const AddToWishlistUseCase(this._repo);
  final WishlistRepository _repo;
  Future<void> call(SaveWishlistInput input) => _repo.add(input);
}

class RemoveFromWishlistUseCase {
  const RemoveFromWishlistUseCase(this._repo);
  final WishlistRepository _repo;
  Future<void> call(String productId) => _repo.remove(productId);
}

class ClearWishlistUseCase {
  const ClearWishlistUseCase(this._repo);
  final WishlistRepository _repo;
  Future<void> call() => _repo.clearAll();
}