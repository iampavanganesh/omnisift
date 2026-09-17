import 'package:dio/dio.dart';
import '../../../core/errors/error_mapper.dart';
import '../../../core/network/api_client.dart';
import '../domain/entities/deal.dart';

class DealsApiDatasource {
  DealsApiDatasource(this._client);
  final ApiClient _client;

  Future<List<Deal>> list({int limit = 20}) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/deals',
        queryParameters: {'limit': limit},
      );
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(_fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Deal _fromJson(Map<String, dynamic> j) => Deal(
        productId: j['productId'] as String? ?? '',
        title: j['title'] as String? ?? '',
        imageUrl: j['imageUrl'] as String?,
        platform: j['platform'] as String? ?? '',
        price: (j['price'] as num?)?.toDouble() ?? 0,
        mrp: (j['mrp'] as num?)?.toDouble(),
        discountPct: (j['discountPct'] as num?)?.toInt() ?? 0,
        productUrl: j['productUrl'] as String? ?? '',
        currency: j['currency'] as String? ?? 'INR',
      );
}
