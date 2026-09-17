import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/repositories/wishlist_repository.dart';
import '../models/wishlist_item_dto.dart';

class WishlistApiDatasource {
  WishlistApiDatasource(this._client);
  final ApiClient _client;

  /// Returns items + the Supabase max limit (meta.max) so the UI can show count/max.
  Future<WishlistListResult> list() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/wishlist');
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      final items = list.map(WishlistItemDto.fromJson).toList();
      final meta = res.data!['meta'] as Map<String, dynamic>?;
      final max = (meta?['max'] as num?)?.toInt() ?? 30; // fallback 30
      return WishlistListResult(items: items, max: max);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> add(SaveWishlistInput i) async {
    try {
      await _client.dio.post<dynamic>('/wishlist', data: {
        'productId': i.productId,
        'token': i.token,
        'title': i.title,
        'imageUrl': i.imageUrl,
        'price': i.price,
        'platform': i.platform,
        'productUrl': i.productUrl,
      });
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> remove(String productId) async {
    try {
      await _client.dio.delete<dynamic>('/wishlist/$productId');
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  /// Clear all saved items for the current user.
  Future<void> clearAll() async {
    try {
      await _client.dio.delete<dynamic>('/wishlist');
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}