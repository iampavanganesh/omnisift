import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../search/domain/entities/product.dart';
import '../../../search/presentation/providers/search_providers.dart';

/// Real "most searched in the last 24 hours" — derived from logged search
/// analytics + cached search results (see backend `GET /discovery/most-searched`).
final mostSearchedProductsProvider = FutureProvider<List<Product>>(
  (ref) => ref.watch(searchRepositoryProvider).mostSearched(),
);
