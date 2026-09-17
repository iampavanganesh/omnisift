import 'package:flutter/widgets.dart';

abstract final class AppRadius {
  static const double xs = 4;
  static const double sm = 6;
  static const double md = 10;
  static const double lg = 16;
  static const double xl = 20;
  static const double pill = 999;
  static BorderRadius all(double r) => BorderRadius.circular(r);
}
