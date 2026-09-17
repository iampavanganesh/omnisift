// C:\omnisift_final\apps\client\lib\features\notifications\presentation\providers\push_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../application/push_service.dart';
import '../../infrastructure/datasources/device_token_api_datasource.dart';

final _deviceTokenDatasourceProvider = Provider<DeviceTokenApiDatasource>(
  (ref) => DeviceTokenApiDatasource(ref.watch(apiClientProvider)),
);

final pushServiceProvider = Provider<PushService>(
  (ref) => PushService(ref.watch(_deviceTokenDatasourceProvider)),
);