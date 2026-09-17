import 'package:dio/dio.dart';
import 'package:omnisift/core/errors/error_mapper.dart';
import 'package:omnisift/core/network/api_client.dart';
import 'package:omnisift/features/auth/infrastructure/models/session_dto.dart';

/// Talks to the Omnisift Auth API via the single Dio ApiClient.
/// Unwraps the { success, data } envelope and maps transport errors to Failures.
class AuthApiDatasource {
  AuthApiDatasource(this._client);
  final ApiClient _client;

  Future<SessionDto> login(String email, String password) =>
      _postSession('/auth/login', {'email': email, 'password': password});

  Future<SessionDto> googleSignIn(String idToken) =>
      _postSession('/auth/google', {'idToken': idToken});
  
  Future<SessionDto> register(String fullName, String email, String password) =>
      _postSession('/auth/register', {
        'fullName': fullName,
        'email': email,
        'password': password,
      });

  Future<void> logout() async {
    try {
      await _client.dio.post<dynamic>('/auth/logout');
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _client.dio.post<dynamic>('/auth/forgot-password', data: {'email': email});
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<SessionDto> _postSession(String path, Map<String, dynamic> body) async {
    try {
      final res = await _client.dio.post<Map<String, dynamic>>(path, data: body);
      final data = res.data!['data'] as Map<String, dynamic>;
      return SessionDto.fromJson(data);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}
