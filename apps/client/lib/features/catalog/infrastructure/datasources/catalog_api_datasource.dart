import 'package:dio/dio.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_client.dart';
import '../models/brand_dto.dart';
import '../models/catalog_detail_dto.dart';
import '../models/category_dto.dart';

class CatalogApiDatasource {
  CatalogApiDatasource(this._client);
  final ApiClient _client;

  Future<List<CategoryDto>> categories() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/categories');
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(CategoryDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<List<BrandDto>> brands() async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/brands');
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(BrandDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<CategoryDetailDto> categoryDetail(
    String slug, {
    required String sort,
    required int page,
    double? minPrice,
    double? maxPrice,
    List<String> brands = const [],
    double minRating = 0,
    Map<String, List<String>> specs = const {},
  }) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/categories/$slug',
        queryParameters: {
          'sort': sort,
          'page': page,
          if (minPrice != null) 'minPrice': minPrice,
          if (maxPrice != null) 'maxPrice': maxPrice,
          if (brands.isNotEmpty) 'brands': brands.join(','),
          if (minRating > 0) 'minRating': minRating,
          if (specs.isNotEmpty) 'specs': _encodeSpecs(specs),
        },
      );
      return CategoryDetailDto.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  /// "key1:val1|val2,key2:val3" — dio percent-encodes the whole query value
  /// for transport, same as every other param here; the backend decodes it
  /// back to this literal string before splitting on the delimiters.
  String _encodeSpecs(Map<String, List<String>> specs) =>
      specs.entries.map((e) => '${e.key}:${e.value.join('|')}').join(',');

  Future<List<CategoryFacetDto>> categoryFacets(String slug) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>('/categories/$slug/facets');
      final list = (res.data!['data'] as List).cast<Map<String, dynamic>>();
      return list.map(CategoryFacetDto.fromJson).toList();
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }

  Future<BrandDetailDto> brandDetail(
    String slug, {
    required String sort,
    required int page,
    String? category,
    double? minPrice,
    double? maxPrice,
    double minRating = 0,
  }) async {
    try {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/brands/$slug',
        queryParameters: {
          'sort': sort,
          'page': page,
          if (category != null) 'category': category,
          if (minPrice != null) 'minPrice': minPrice,
          if (maxPrice != null) 'maxPrice': maxPrice,
          if (minRating > 0) 'minRating': minRating,
        },
      );
      return BrandDetailDto.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioError(e);
    }
  }
}
