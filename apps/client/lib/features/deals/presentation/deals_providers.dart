import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client_provider.dart';
import '../domain/entities/deal.dart';
import '../infrastructure/deals_api_datasource.dart';

final _dealsApiProvider = Provider((ref) => DealsApiDatasource(ref.watch(apiClientProvider)));

/// Top current discounts, sourced from live catalog prices. Starts sparse on a
/// fresh install and grows as products are viewed (catalog is populated lazily
/// — see backend `deals` module) — an empty list is expected, not an error.
final dealsProvider = FutureProvider.family<List<Deal>, int>(
  (ref, limit) => ref.watch(_dealsApiProvider).list(limit: limit),
);
