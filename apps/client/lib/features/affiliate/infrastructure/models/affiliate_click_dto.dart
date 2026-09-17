class AffiliateClickDto {
  const AffiliateClickDto({
    required this.id,
    required this.productId,
    required this.productTitle,
    required this.productImageUrl,
    required this.sellerName,
    required this.targetUrl,
    required this.clickedAt,
  });
  final String id;
  final String productId;
  final String productTitle;
  final String? productImageUrl;
  final String sellerName;
  final String targetUrl;
  final String clickedAt;

  factory AffiliateClickDto.fromJson(Map<String, dynamic> j) => AffiliateClickDto(
        id: j['id'] as String? ?? '',
        productId: j['productId'] as String? ?? '',
        productTitle: j['productTitle'] as String? ?? '',
        productImageUrl: j['productImageUrl'] as String?,
        sellerName: j['sellerName'] as String? ?? '',
        targetUrl: j['targetUrl'] as String? ?? '',
        clickedAt: j['clickedAt'] as String? ?? '',
      );
}
