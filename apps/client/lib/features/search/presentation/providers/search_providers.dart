import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client_provider.dart';
import '../../application/usecases/search_products_usecase.dart';
import '../../domain/repositories/search_repository.dart';
import '../../infrastructure/datasources/search_api_datasource.dart';
import '../../infrastructure/repositories/search_repository_impl.dart';

final _searchApiProvider = Provider(
  (ref) => SearchApiDatasource(ref.watch(apiClientProvider)),
);
final searchRepositoryProvider = Provider<SearchRepository>(
  (ref) => SearchRepositoryImpl(ref.watch(_searchApiProvider)),
);
final searchProductsUseCaseProvider = Provider(
  (ref) => SearchProductsUseCase(ref.watch(searchRepositoryProvider)),
);
