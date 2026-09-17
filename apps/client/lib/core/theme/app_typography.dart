import 'package:flutter/material.dart';
import 'app_colors.dart';

abstract final class AppTypography {
  static TextStyle get display =>
      TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.textPrimary, height: 1.2);
  static TextStyle get h1 =>
      TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.textPrimary, height: 1.25);
  static TextStyle get h2 =>
      TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.3);
  static TextStyle get heading =>
      TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary);
  static TextStyle get title =>
      TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.35);
  static TextStyle get body =>
      TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: AppColors.textPrimary, height: 1.5);
  static TextStyle get bodySmall =>
      TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: AppColors.textSecondary, height: 1.45);
  static TextStyle get caption =>
      TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.textSecondary, height: 1.4);
  static TextStyle get label =>
      TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary);
  static TextStyle get price =>
      TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary);
  static TextStyle get priceLarge =>
      TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primary);
}
