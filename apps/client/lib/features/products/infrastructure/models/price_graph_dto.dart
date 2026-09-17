class PriceGraphDto {
  PriceGraphDto({required this.series});
  final List<SellerSeriesDto> series;

  factory PriceGraphDto.fromJson(Map<String, dynamic> json) {
    final list = (json['series'] as List<dynamic>? ?? [])
        .map((e) => SellerSeriesDto.fromJson(e as Map<String, dynamic>))
        .toList();
    return PriceGraphDto(series: list);
  }
}

class SellerSeriesDto {
  SellerSeriesDto({
    required this.sellerId,
    required this.sellerName,
    required this.points,
  });
  final String sellerId;
  final String sellerName;
  final List<GraphPointDto> points;

  factory SellerSeriesDto.fromJson(Map<String, dynamic> json) {
    final pts = (json['points'] as List<dynamic>? ?? [])
        .map((e) => GraphPointDto.fromJson(e as Map<String, dynamic>))
        .toList();
    return SellerSeriesDto(
      sellerId: json['sellerId'] as String,
      sellerName: json['sellerName'] as String,
      points: pts,
    );
  }
}

class GraphPointDto {
  GraphPointDto({
    required this.price,
    required this.mrp,
    required this.discountPct,
    required this.capturedAt,
  });
  final double price;
  final double? mrp;
  final int? discountPct;
  final DateTime capturedAt;

  factory GraphPointDto.fromJson(Map<String, dynamic> json) {
    return GraphPointDto(
      price: (json['price'] as num).toDouble(),
      mrp: json['mrp'] == null ? null : (json['mrp'] as num).toDouble(),
      discountPct: json['discountPct'] as int?,
      capturedAt: DateTime.parse(json['capturedAt'] as String),
    );
  }
}