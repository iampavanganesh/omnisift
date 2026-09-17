import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../models/affiliate_click_dto.dart';

class AffiliateApiDatasource {
  AffiliateApiDatasource(this._client);
  final ApiClient _client;

  // No targetUrl param — the backend derives and stores the real destination
  // from the matching listing itself, never a client-supplied URL.
  Future<void> recordClick({
    required String productId,
    required String platform,
  }) async {
    try {
      await _client.dio.post<dynamic>('/affiliate/clicks', data: {
        'productId': productId,
        'platform': platform,
      });
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<({List<AffiliateClickDto> items, bool hasMore})> history({
    required int page,
    int pageSize = 20,
  }) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/affiliate/clicks',
        queryParameters: {'page': page, 'pageSize': pageSize},
      );
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      final meta = res.data!['meta'] as Map<String, dynamic>?;
      return (
        items: list.map(AffiliateClickDto.fromJson).toList(),
        hasMore: meta?['hasMore'] as bool? ?? false,
      );
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}
