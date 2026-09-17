import 'dart:math';
import 'package:hive/hive.dart';

/// Manages an anonymous session id for analytics.
///
/// - A session is ONE visit. It gets a random id the first time it's needed.
/// - It stays the same across app screens and quick close/reopen.
/// - After [_timeout] of no activity, the next call starts a FRESH session
///   (matches the industry-standard 30-minute inactivity rule).
/// - Persisted in Hive so a quick app restart keeps the same visit; a long gap
///   (30+ min) correctly counts as a new visit.
///
/// This is NOT a user id — it never identifies a person, only a visit.
class SessionManager {
  SessionManager._();

  static const _boxName = 'session';
  static const _idKey = 'session_id';
  static const _lastSeenKey = 'session_last_seen';
  static const Duration _timeout = Duration(minutes: 30);

  static Box<dynamic>? _box;

  /// Call once at app start (after Hive is initialised) to open the box.
  static Future<void> init() async {
    _box = await Hive.openBox<dynamic>(_boxName);
  }

  /// The current session id. Reads/refreshes based on the 30-min timeout.
  /// Safe to call on every request. Returns '' if the box isn't ready yet
  /// (so a missing session never breaks a request).
  static String get current {
    final box = _box;
    if (box == null) return '';

    final now = DateTime.now().millisecondsSinceEpoch;
    final lastSeen = box.get(_lastSeenKey) as int?;
    String? id = box.get(_idKey) as String?;

    final expired = lastSeen == null ||
        (now - lastSeen) > _timeout.inMilliseconds;

    if (id == null || id.isEmpty || expired) {
      id = _newId();
      box.put(_idKey, id);
    }
    // Slide the window: every activity refreshes "last seen".
    box.put(_lastSeenKey, now);
    return id;
  }

  /// Generate a random session id (no external uuid package needed).
  static String _newId() {
    final rand = Random.secure();
    final now = DateTime.now().millisecondsSinceEpoch;
    final bytes = List<int>.generate(8, (_) => rand.nextInt(256));
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return 's_${now}_$hex';
  }
}