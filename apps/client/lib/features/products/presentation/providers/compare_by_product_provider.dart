// C:\omnisift_final\apps\client\lib\features\products\presentation\providers\compare_by_product_provider.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../domain/entities/comparison.dart';
import '../../infrastructure/models/comparison_dto.dart';

/// Result of a compare-by-product fetch: the comparison + freshness metadata.
class CompareByProductResult {
  CompareByProductResult({required this.comparison, required this.capturedAt, required this.fresh});
  final Comparison comparison;
  final DateTime capturedAt;
  final bool fresh;
}

class CompareByProductDatasource {
  CompareByProductDatasource(this._client);
  final ApiClient _client;

  Future<CompareByProductResult> fetch(String productId) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/products/compare-by-product',
        queryParameters: {'productId': productId},
      );
      final data = res.data!['data'] as Map<String, dynamic>;
      final meta = res.data!['meta'] as Map<String, dynamic>?;
      final Comparison comparison = ComparisonDto.fromJson(data).comparison;
      final capturedAt =
          DateTime.tryParse(meta?['capturedAt'] as String? ?? '') ?? DateTime.now();
      final fresh = meta?['fresh'] as bool? ?? true;
      return CompareByProductResult(comparison: comparison, capturedAt: capturedAt, fresh: fresh);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}

final _compareByProductDatasourceProvider = Provider<CompareByProductDatasource>(
  (ref) => CompareByProductDatasource(ref.watch(apiClientProvider)),
);

/// Loads the current comparison for a product id (cached or refreshed server-side).
final compareByProductProvider =
    FutureProvider.family<CompareByProductResult, String>((ref, productId) {
  return ref.watch(_compareByProductDatasourceProvider).fetch(productId);
});