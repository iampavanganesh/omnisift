import 'package:dio/dio.dart';
import 'failure.dart';

/// Maps transport/HTTP errors into domain Failures. Called in the data layer.
Failure mapDioError(DioException e) {
  if (e.type == DioExceptionType.connectionError ||
      e.type == DioExceptionType.connectionTimeout ||
      e.type == DioExceptionType.receiveTimeout) {
    return const NetworkFailure();
  }
  final status = e.response?.statusCode ?? 0;
  final msg = _serverMessage(e) ?? 'Something went wrong. Please try again.';
  return switch (status) {
    400 || 422 => ValidationFailure(msg),
    401 => const AuthFailure(),
    403 => const AuthFailure('You do not have access to this.'),
    404 => const NotFoundFailure(),
    502 || 503 => const ProviderFailure(),
    _ => ServerFailure(msg),
  };
}

String? _serverMessage(DioException e) {
  final data = e.response?.data;
  if (data is Map && data['error'] is Map) {
    return data['error']['message'] as String?;
  }
  return null;
}
