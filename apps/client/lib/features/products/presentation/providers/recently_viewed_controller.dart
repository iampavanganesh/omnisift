import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import '../../../search/domain/entities/product.dart';

/// Persists the products the user has opened (Product Detail), most-recent
/// first, for the Profile → "Recently Viewed" screen. Local-only (Hive), no
/// backend — same pattern as [RecentSearchesController].
final recentlyViewedProvider =
    NotifierProvider<RecentlyViewedController, List<Product>>(RecentlyViewedController.new);

class RecentlyViewedController extends Notifier<List<Product>> {
  static const _box = 'recently_viewed';
  static const _key = 'items';
  static const _max = 20;

  @override
  List<Product> build() {
    final raw = (Hive.box<dynamic>(_box).get(_key, defaultValue: <String>[]) as List).cast<String>();
    return raw.map((s) => _fromJson(jsonDecode(s) as Map<String, dynamic>)).toList();
  }

  void add(Product product) {
    if (product.productId.isEmpty) return;
    final list = [
      product,
      ...state.where((p) => p.productId != product.productId),
    ].take(_max).toList();
    Hive.box<dynamic>(_box).put(_key, list.map((p) => jsonEncode(_toJson(p))).toList());
    state = list;
  }

  void clear() {
    Hive.box<dynamic>(_box).delete(_key);
    state = const [];
  }

  Map<String, dynamic> _toJson(Product p) => {
        'token': p.token,
        'productId': p.productId,
        'title': p.title,
        'platform': p.platform,
        'price': p.price,
        'oldPrice': p.oldPrice,
        'currency': p.currency,
        'imageUrl': p.imageUrl,
        'productUrl': p.productUrl,
        'rating': p.rating,
        'reviewCount': p.reviewCount,
        'delivery': p.delivery,
        'brand': p.brand,
      };

  Product _fromJson(Map<String, dynamic> j) => Product(
        token: j['token'] as String? ?? '',
        productId: j['productId'] as String? ?? '',
        title: j['title'] as String? ?? '',
        platform: j['platform'] as String? ?? '',
        price: (j['price'] as num?)?.toDouble() ?? 0,
        oldPrice: (j['oldPrice'] as num?)?.toDouble(),
        currency: j['currency'] as String? ?? 'INR',
        imageUrl: j['imageUrl'] as String? ?? '',
        productUrl: j['productUrl'] as String? ?? '',
        rating: (j['rating'] as num?)?.toDouble(),
        reviewCount: (j['reviewCount'] as num?)?.toInt(),
        delivery: j['delivery'] as String? ?? '',
        brand: j['brand'] as String? ?? '',
      );
}
