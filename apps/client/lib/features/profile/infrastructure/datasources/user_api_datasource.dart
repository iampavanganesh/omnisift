import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/user_profile.dart';
import '../models/user_profile_dto.dart';

class UserApiDatasource {
  UserApiDatasource(this._client);
  final ApiClient _client;

  Future<UserProfile> me() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/users/me');
      return UserProfileDto.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<UserProfile> update({String? fullName, String? phone}) async {
    try {
      final body = <String, dynamic>{};
      if (fullName != null) body['fullName'] = fullName;
      if (phone != null) body['phone'] = phone;
      final res = await _client.dio.patch<Map<String, dynamic>>('/users/me', data: body);
      return UserProfileDto.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}
