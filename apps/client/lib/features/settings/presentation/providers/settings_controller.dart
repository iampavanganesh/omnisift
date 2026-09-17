import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

class SettingsState {
  const SettingsState({this.email = true});
  final bool email;

  SettingsState copyWith({bool? email}) => SettingsState(email: email ?? this.email);
}

final settingsProvider =
    NotifierProvider<SettingsController, SettingsState>(SettingsController.new);

class SettingsController extends Notifier<SettingsState> {
  static const _box = 'settings';
  Box<dynamic> get _b => Hive.box<dynamic>(_box);

  @override
  SettingsState build() => SettingsState(
        email: _b.get('email', defaultValue: true) as bool,
      );

  void setEmail(bool v) {
    _b.put('email', v);
    state = state.copyWith(email: v);
  }
}
