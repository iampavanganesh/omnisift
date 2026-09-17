import 'package:flutter/material.dart';
import 'app_colors.dart';

abstract final class AppTypography {
  static TextStyle get display =>
      TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.textPrimary);
  static TextStyle get heading =>
      TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary);
  static TextStyle get title =>
      TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: AppColors.textPrimary);
  static TextStyle get body =>
      TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: AppColors.textPrimary);
  static TextStyle get caption =>
      TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.textSecondary);
}
