// C:\omnisift_final\apps\client\lib\features\alerts\presentation\providers\alerts_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../infrastructure/datasources/alerts_api_datasource.dart';

final alertsDatasourceProvider = Provider<AlertsApiDatasource>(
  (ref) => AlertsApiDatasource(ref.watch(apiClientProvider)),
);

/// Immutable state for the alerts list screen.
class AlertsState {
  const AlertsState({this.items = const [], this.loading = false, this.error});
  final List<AlertDto> items;
  final bool loading;
  final String? error;

  AlertsState copyWith({List<AlertDto>? items, bool? loading, String? error}) =>
      AlertsState(
        items: items ?? this.items,
        loading: loading ?? this.loading,
        error: error,
      );

  /// True if this product already has any alert set.
  bool hasAlert(String productId) => items.any((a) => a.productId == productId);
}

final alertsControllerProvider =
    NotifierProvider<AlertsController, AlertsState>(AlertsController.new);

/// Holds the user's alerts + drives create/delete/toggle. Screens call these;
/// they never touch the datasource directly.
class AlertsController extends Notifier<AlertsState> {
  @override
  AlertsState build() => const AlertsState();

  AlertsApiDatasource get _ds => ref.read(alertsDatasourceProvider);

  Future<void> load() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final items = await _ds.list();
      state = state.copyWith(items: items, loading: false);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  /// Create an alert, then refresh the list. Rethrows so the UI can show errors.
  Future<void> create({
    required String productId,
    required String type,
    double? targetPrice,
  }) async {
    await _ds.create(productId: productId, type: type, targetPrice: targetPrice);
    await load();
  }

  /// Optimistic — removes the row immediately so the list can't get stuck
  /// showing a deleted item, and reverts + surfaces the error on failure
  /// (never lets the exception reach the widget tree unguarded).
  Future<void> delete(String id) async {
    final backup = state.items;
    state = state.copyWith(items: backup.where((a) => a.id != id).toList());
    try {
      await _ds.delete(id);
    } catch (e) {
      state = state.copyWith(items: backup, error: e.toString());
      rethrow;
    }
  }

  /// Optimistic toggle — reverts + surfaces the error on failure.
  Future<void> toggle(String id, bool isActive) async {
    final backup = state.items;
    state = state.copyWith(
      items: [
        for (final a in backup)
          if (a.id == id) a.copyWith(isActive: isActive) else a,
      ],
    );
    try {
      await _ds.setActive(id, isActive);
      await load();
    } catch (e) {
      state = state.copyWith(items: backup, error: e.toString());
      rethrow;
    }
  }
}