import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../infrastructure/datasources/affiliate_api_datasource.dart';

final affiliateApiProvider = Provider((ref) => AffiliateApiDatasource(ref.watch(apiClientProvider)));

/// Fire-and-forget click recording (see product_detail_screen's seller-row
/// tap handler). Never awaited in a way that blocks navigating to the store.
final recordAffiliateClickProvider = Provider((ref) {
  final api = ref.watch(affiliateApiProvider);
  return ({required String productId, required String platform}) =>
      api.recordClick(productId: productId, platform: platform);
});
