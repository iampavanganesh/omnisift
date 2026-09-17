// C:\omnisift_final\apps\client\lib\features\notifications\infrastructure\datasources\device_token_api_datasource.dart
import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';

class DeviceTokenApiDatasource {
  DeviceTokenApiDatasource(this._client);
  final ApiClient _client;

  Future<void> register(String token, String platform) async {
    try {
      await _client.dio.post<dynamic>('/device-tokens', data: {
        'token': token,
        'platform': platform,
      });
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> unregister(String token) async {
    try {
      await _client.dio.delete<dynamic>('/device-tokens', data: {'token': token});
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}