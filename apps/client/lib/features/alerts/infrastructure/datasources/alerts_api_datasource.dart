// C:\omnisift_final\apps\client\lib\features\alerts\infrastructure\datasources\alerts_api_datasource.dart
import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';

/// One alert as returned by GET /price-alerts.
class AlertDto {
  AlertDto({
    required this.id,
    required this.productId,
    required this.type,
    required this.targetPrice,
    required this.isActive,
    required this.productTitle,
    required this.productImageUrl,
  });

  final String id;
  final String productId;
  final String type; // 'ANY_DROP' | 'BELOW_TARGET'
  final double? targetPrice;
  final bool isActive;
  final String? productTitle;
  final String? productImageUrl;

  factory AlertDto.fromJson(Map<String, dynamic> j) => AlertDto(
        id: j['id'] as String,
        productId: j['productId'] as String,
        type: j['type'] as String,
        targetPrice: (j['targetPrice'] as num?)?.toDouble(),
        isActive: j['isActive'] as bool? ?? true,
        productTitle: j['productTitle'] as String?,
        productImageUrl: j['productImageUrl'] as String?,
      );

  AlertDto copyWith({bool? isActive}) => AlertDto(
        id: id,
        productId: productId,
        type: type,
        targetPrice: targetPrice,
        isActive: isActive ?? this.isActive,
        productTitle: productTitle,
        productImageUrl: productImageUrl,
      );
}

class AlertsApiDatasource {
  AlertsApiDatasource(this._client);
  final ApiClient _client;

  Future<List<AlertDto>> list() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/price-alerts');
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(AlertDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  /// Create/update an alert. type = 'ANY_DROP' | 'BELOW_TARGET'.
  Future<void> create({
    required String productId,
    required String type,
    double? targetPrice,
  }) async {
    try {
      await _client.dio.post<dynamic>('/price-alerts', data: {
        'productId': productId,
        'type': type,
        if (targetPrice != null) 'targetPrice': targetPrice,
      });
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _client.dio.delete<dynamic>('/price-alerts/$id');
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> setActive(String id, bool isActive) async {
    try {
      await _client.dio.patch<dynamic>('/price-alerts/$id', data: {'isActive': isActive});
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}