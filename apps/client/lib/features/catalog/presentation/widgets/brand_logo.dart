import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/brand.dart';

/// Curated brand name → official domain, for fetching a real logo via
/// Clearbit's public logo API (hotlinked live from the source, same
/// "don't host trademarked assets ourselves" approach this codebase already
/// uses for seller favicons pulled straight from SerpAPI responses).
const Map<String, String> _brandDomains = {
  'Apple': 'apple.com',
  'Samsung': 'samsung.com',
  'Sony': 'sony.com',
  'Google': 'google.com',
  'OnePlus': 'oneplus.com',
  'Xiaomi': 'mi.com',
  'Redmi': 'mi.com',
  'Realme': 'realme.com',
  'boAt': 'boat-lifestyle.com',
  'Motorola': 'motorola.com',
  'OPPO': 'oppo.com',
  'Vivo': 'vivo.com',
  'Nothing': 'nothing.tech',
  'JBL': 'jbl.com',
  'HP': 'hp.com',
  'Dell': 'dell.com',
  'Lenovo': 'lenovo.com',
  'Asus': 'asus.com',
  'Acer': 'acer.com',
  'Puma': 'puma.com',
  'Nike': 'nike.com',
  'Adidas': 'adidas.com',
};

/// Live official logo URL for a recognized brand, else null (caller falls
/// back to a colored-letter tile — never a fabricated logo). Clearbit gives
/// a proper brand mark when reachable, but its domain is blocked by many
/// ad-blockers/network policies — Google's favicon service is the fallback
/// (same service SerpAPI's own seller logos already use), which is far more
/// reliably reachable but sometimes just a generic app-icon-style favicon
/// rather than the real wordmark.
String? clearbitLogoUrl(String brandName) {
  final domain = _brandDomains[brandName];
  return domain == null ? null : 'https://logo.clearbit.com/$domain';
}

String? faviconLogoUrl(String brandName) {
  final domain = _brandDomains[brandName];
  return domain == null ? null : 'https://www.google.com/s2/favicons?domain=$domain&sz=128';
}

bool hasKnownLogo(Brand brand) => brand.logoUrl != null || _brandDomains.containsKey(brand.name);

/// Resolves, in order: the DB's own `logoUrl` (if an admin ever sets one) →
/// Clearbit's logo API → Google's favicon service → a colored-initial tile.
/// Never fabricates a logo for a brand we don't recognize.
class BrandLogo extends StatelessWidget {
  const BrandLogo({required this.brand, this.size = 56, super.key});
  final Brand brand;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (brand.logoUrl != null) {
      return CachedNetworkImage(
        imageUrl: brand.logoUrl!,
        width: size,
        height: size,
        fit: BoxFit.contain,
        errorWidget: (_, __, ___) => _clearbitThenFavicon(),
      );
    }
    return _clearbitThenFavicon();
  }

  Widget _clearbitThenFavicon() {
    final clearbit = clearbitLogoUrl(brand.name);
    if (clearbit == null) return _faviconThenInitial();
    return CachedNetworkImage(
      imageUrl: clearbit,
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorWidget: (_, __, ___) => _faviconThenInitial(),
    );
  }

  Widget _faviconThenInitial() {
    final favicon = faviconLogoUrl(brand.name);
    if (favicon == null) return _initial();
    return CachedNetworkImage(
      imageUrl: favicon,
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorWidget: (_, __, ___) => _initial(),
    );
  }

  Widget _initial() => Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        color: AppColors.primary,
        child: Text(
          brand.name.isNotEmpty ? brand.name[0].toUpperCase() : '?',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: size * 0.42,
          ),
        ),
      );
}
