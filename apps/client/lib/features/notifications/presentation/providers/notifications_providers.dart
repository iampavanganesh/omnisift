import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_client_provider.dart';

class NotificationItem {
  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final bool isRead;
  final DateTime createdAt;

  factory NotificationItem.fromJson(Map<String, dynamic> j) => NotificationItem(
        id: j['id'] as String,
        type: j['type'] as String? ?? 'SYSTEM',
        title: j['title'] as String? ?? '',
        body: j['body'] as String? ?? '',
        isRead: j['isRead'] as bool? ?? false,
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
}

class NotificationsApiDatasource {
  NotificationsApiDatasource(this._client);
  final ApiClient _client;

  Future<({List<NotificationItem> items, int unread})> list() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/notifications');
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      final items = list.map(NotificationItem.fromJson).toList();
      final meta = res.data!['meta'] as Map<String, dynamic>?;
      final unread = (meta?['unreadCount'] as num?)?.toInt() ??
          items.where((n) => !n.isRead).length;
      return (items: items, unread: unread);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _client.dio.patch<dynamic>('/notifications/$id/read');
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<void> markAllRead() async {
    try {
      await _client.dio.patch<dynamic>('/notifications/read-all');
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}

final _notificationsDatasourceProvider = Provider<NotificationsApiDatasource>(
  (ref) => NotificationsApiDatasource(ref.watch(apiClientProvider)),
);

class NotificationsState {
  const NotificationsState({this.items = const [], this.unread = 0, this.loading = false});
  final List<NotificationItem> items;
  final int unread;
  final bool loading;

  NotificationsState copyWith({List<NotificationItem>? items, int? unread, bool? loading}) =>
      NotificationsState(
        items: items ?? this.items,
        unread: unread ?? this.unread,
        loading: loading ?? this.loading,
      );
}

final notificationsControllerProvider =
    NotifierProvider<NotificationsController, NotificationsState>(NotificationsController.new);

class NotificationsController extends Notifier<NotificationsState> {
  @override
  NotificationsState build() => const NotificationsState();

  NotificationsApiDatasource get _ds => ref.read(_notificationsDatasourceProvider);

  Future<void> load() async {
    state = state.copyWith(loading: true);
    try {
      final res = await _ds.list();
      state = state.copyWith(items: res.items, unread: res.unread, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _ds.markRead(id);
      await load();
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _ds.markAllRead();
      await load();
    } catch (_) {}
  }
}