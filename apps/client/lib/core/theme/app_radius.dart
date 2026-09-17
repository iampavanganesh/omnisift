import 'package:flutter/widgets.dart';

abstract final class AppRadius {
  static const double sm = 6;
  static const double md = 10;
  static const double lg = 16;
  static const double xl = 24;
  static BorderRadius all(double r) => BorderRadius.circular(r);
}
