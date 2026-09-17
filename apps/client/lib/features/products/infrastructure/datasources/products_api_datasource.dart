import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../../../catalog/infrastructure/models/catalog_detail_dto.dart';
import '../models/comparison_dto.dart';
import '../models/price_graph_dto.dart';

class ProductsApiDatasource {
  ProductsApiDatasource(this._client);
  final ApiClient _client;

  Future<ComparisonDto> getComparison(String token, {String? productId}) async {
    print('🔵 FRONTEND firing compare for token=${token.substring(0, 8)} at ${DateTime.now()}');
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/products/comparison',
        queryParameters: {
          'token': token,
          if (productId != null && productId.isNotEmpty) 'productId': productId,
        },
      );
      return ComparisonDto.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<PriceGraphDto> getPriceGraph(String productId, int days) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/products/price-graph',
        queryParameters: {'productId': productId, 'days': days},
      );
      return PriceGraphDto.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<List<CatalogProductDto>> getSimilarProducts(String productId, {int limit = 8}) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/products/$productId/similar',
        queryParameters: {'limit': limit},
      );
      return (res.data!['data'] as List).cast<Map<String, dynamic>>().map(CatalogProductDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<List<VariantSiblingDto>> getVariantSiblings(String productId) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/products/$productId/variant-siblings');
      return (res.data!['data'] as List).cast<Map<String, dynamic>>().map(VariantSiblingDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}