import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

class RecentSearch {
  const RecentSearch(this.query, this.image);
  final String query;
  final String image;
  Map<String, dynamic> toJson() => {'q': query, 'img': image};
  factory RecentSearch.fromJson(Map<String, dynamic> m) =>
      RecentSearch(m['q'] as String? ?? '', m['img'] as String? ?? '');
}

/// Persists the user's last searches (query + representative product image).
final recentSearchesProvider =
    NotifierProvider<RecentSearchesController, List<RecentSearch>>(RecentSearchesController.new);

class RecentSearchesController extends Notifier<List<RecentSearch>> {
  static const _box = 'recent_searches';
  static const _key = 'items';

  @override
  List<RecentSearch> build() {
    final raw = (Hive.box<dynamic>(_box).get(_key, defaultValue: <String>[]) as List).cast<String>();
    return raw
        .map((s) => RecentSearch.fromJson(jsonDecode(s) as Map<String, dynamic>))
        .toList();
  }

  void add(String query, String image) {
    final q = query.trim();
    if (q.isEmpty) return;
    final list = [
      RecentSearch(q, image),
      ...state.where((e) => e.query.toLowerCase() != q.toLowerCase()),
    ].take(20).toList();
    Hive.box<dynamic>(_box).put(_key, list.map((e) => jsonEncode(e.toJson())).toList());
    state = list;
  }

  void clear() {
    Hive.box<dynamic>(_box).delete(_key);
    state = const [];
  }
}
