class AffiliateClick {
  const AffiliateClick({
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
  final DateTime clickedAt;
}
