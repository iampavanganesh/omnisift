import '../../domain/entities/product.dart';
import '../models/product_dto.dart';

Product productDtoToEntity(ProductDto d) => Product(
      token: d.token,
      productId: d.productId,
      title: d.title,
      platform: d.platform,
      price: d.price,
      oldPrice: d.oldPrice,
      currency: d.currency,
      imageUrl: d.imageUrl,
      productUrl: d.productUrl,
      rating: d.rating,
      reviewCount: d.reviewCount,
      delivery: d.delivery,
      brand: d.brand,
      category: d.category,
    );
