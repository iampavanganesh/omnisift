import 'dart:developer' as dev;
import 'package:dio/dio.dart';

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    dev.log('→ ${options.method} ${options.uri}', name: 'api');
    handler.next(options);
  }

  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    dev.log('← ${response.statusCode} ${response.requestOptions.uri}', name: 'api');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    dev.log('✗ ${err.response?.statusCode} ${err.requestOptions.uri}', name: 'api');
    handler.next(err);
  }
}
