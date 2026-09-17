import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../models/product_dto.dart';

class SearchApiDatasource {
  SearchApiDatasource(this._client);
  final ApiClient _client;

  Future<List<String>> suggestions(String query) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/search/suggestions',
        queryParameters: {'q': query},
      );
      return (res.data!['data'] as List).cast<String>();
    } on DioException catch (_) {
      return const []; // non-critical
    }
  }

  /// `hasMore` comes straight from the backend's real meta.hasMore — derived
  /// server-side from the actual page ceiling (search.schemas.ts), not
  /// guessed here from whether this page happened to have results.
  Future<({List<ProductDto> products, bool hasMore})> search(String query, int page) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/search',
        queryParameters: {'q': query, 'page': page},
      );
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      final meta = res.data!['meta'] as Map<String, dynamic>?;
      return (
        products: list.map(ProductDto.fromJson).toList(),
        hasMore: meta?['hasMore'] as bool? ?? false,
      );
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<List<ProductDto>> mostSearched({int hours = 24, int limit = 12}) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/discovery/most-searched',
        queryParameters: {'hours': hours, 'limit': limit},
      );
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(ProductDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<List<ProductDto>> mostSearchedInCategory(
    String categorySlug, {
    int hours = 24,
    int limit = 4,
  }) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/discovery/most-searched/$categorySlug',
        queryParameters: {'hours': hours, 'limit': limit},
      );
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(ProductDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}
