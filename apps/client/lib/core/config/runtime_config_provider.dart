import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client_provider.dart';
import 'runtime_config_datasource.dart';

final _runtimeConfigDatasourceProvider = Provider(
  (ref) => RuntimeConfigDatasource(ref.watch(apiClientProvider)),
);

/// Auto-scroll page cap from the backend (Supabase app_config), read once on
/// startup and cached for the app's lifetime. Falls back to 4 on failure.
/// Change the Supabase value -> takes effect on the app's NEXT launch.
final maxSearchPagesProvider = FutureProvider<int>((ref) async {
  return ref.watch(_runtimeConfigDatasourceProvider).maxSearchPages();
});

/// Whether to show the price-history graph. Read from the backend
/// (Supabase app_config → price_graph_enabled). Change the Supabase value →
/// takes effect on the app's NEXT launch. Falls back to false.
final priceGraphEnabledProvider = FutureProvider<bool>((ref) async {
  return ref.watch(_runtimeConfigDatasourceProvider).priceGraphEnabled();
});