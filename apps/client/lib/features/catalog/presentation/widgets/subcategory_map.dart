import 'package:flutter/material.dart';

/// The catalog's actual fixed taxonomy (backend `catalog-clean.ts` CATEGORIES
/// — keep in sync if that list changes). 'Uncategorized' is a real bucket but
/// never shown to users (see [isUserFacingCategory]).
const List<String> knownCategories = [
  'Mobiles',
  'Laptops',
  'Electronics',
  'Fashion',
  'Home',
  'Appliances',
  'Beauty',
  'Sports',
  'Toys and Games',
  'Automotive',
  'Books',
  'Grocery',
  'Audio',
  'Wearables',
  'Footwear',
  'Clothing',
  'Bottles',
  'Accessories',
];

bool isUserFacingCategory(String name) => name != 'Uncategorized';

const Map<String, IconData> categoryIcons = {
  'Mobiles': Icons.smartphone,
  'Laptops': Icons.laptop_mac,
  'Electronics': Icons.devices_other,
  'Fashion': Icons.diamond_outlined,
  'Home': Icons.chair_outlined,
  'Appliances': Icons.kitchen,
  'Beauty': Icons.face_retouching_natural,
  'Sports': Icons.sports_cricket,
  'Toys and Games': Icons.toys,
  'Automotive': Icons.directions_car_filled_outlined,
  'Books': Icons.menu_book,
  'Grocery': Icons.local_grocery_store,
  'Audio': Icons.headphones,
  'Wearables': Icons.watch,
  'Footwear': Icons.hiking,
  'Clothing': Icons.checkroom,
  'Bottles': Icons.local_drink,
  'Accessories': Icons.category,
};

/// Soft per-category tint so the "Shop by Category" row reads with some
/// variety instead of one flat color repeated — not a new brand palette,
/// just muted background tiles behind the existing icon color.
// Was soft blue/violet for Mobiles/Laptops/Appliances/Clothing — a direct
// violation of the frozen no-blue/purple brand rule fixed on web in an
// earlier phase; replaced here with warm tints to match.
const Map<String, Color> categoryTints = {
  'Mobiles': Color(0xFFF7E6D7), // soft cream-tan
  'Laptops': Color(0xFFF3DFD2), // soft terracotta-tint
  'Electronics': Color(0xFFE5EEF0), // soft slate
  'Fashion': Color(0xFFFBE8F0), // soft rose
  'Home': Color(0xFFF1EDE4), // soft beige
  'Appliances': Color(0xFFFDEBD3), // soft apricot
  'Beauty': Color(0xFFFCE9F1), // soft blush
  'Sports': Color(0xFFE6F4EA), // soft mint
  'Toys and Games': Color(0xFFFFF3DE), // soft yellow
  'Automotive': Color(0xFFEAEDF2), // soft steel
  'Books': Color(0xFFF3EBE0), // soft sand
  'Grocery': Color(0xFFE9F6E9), // soft leaf
  'Audio': Color(0xFFFCE8EE), // soft pink
  'Wearables': Color(0xFFE6F5EC), // soft green
  'Footwear': Color(0xFFFFF1DE), // soft amber
  'Clothing': Color(0xFFFBE5DD), // soft coral
  'Bottles': Color(0xFFE6F7F6), // soft teal
  'Accessories': Color(0xFFF3E9E2), // soft tan
};

IconData iconForCategory(String name) => categoryIcons[name] ?? Icons.category;
Color tintForCategory(String name) => categoryTints[name] ?? const Color(0xFFEFEFEF);

/// There's no real subcategory data — these are curated keyword refinements
/// that narrow the same underlying search query (e.g. "Mobiles" + "Smartphones"
/// searches "Mobiles Smartphones"). Anything not listed here just shows "All".
const Map<String, List<String>> categorySubchips = {
  'Mobiles': ['Smartphones', 'Feature Phones', 'Accessories'],
  'Laptops': ['Laptops', 'Accessories'],
  'Clothing': ['Men', 'Women', 'Kids'],
  'Footwear': ['Men', 'Women', 'Kids'],
};

/// Same idea, keyed by brand name instead of category (e.g. Brand Page's
/// "Shop [Brand] Products" chip row).
const Map<String, List<String>> brandTypeChips = {
  'Apple': ['iPhone', 'iPad', 'Mac', 'Watch', 'Accessories'],
  'Samsung': ['Smartphones', 'Tablets', 'Watches', 'Audio', 'Accessories'],
  'Sony': ['Audio', 'TVs', 'Cameras', 'Accessories'],
};

List<String> subchipsFor(Map<String, List<String>> map, String name) =>
    ['All', ...(map[name] ?? const [])];
