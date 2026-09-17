import { Module } from '@nestjs/common';
import { ProductAcquisitionService } from './application/services/product-acquisition.service';
import { CatalogRepository } from './domain/repositories/catalog.repository';
import { CatalogPrismaRepository } from './infrastructure/repositories/catalog.prisma.repository';
import { ProductExternalIdRepository } from './domain/repositories/product-external-id.repository';
import { PrismaProductExternalIdRepository } from './infrastructure/repositories/prisma-product-external-id.repository';
import { CategoryQueryRepository } from './domain/repositories/category-query.repository';
import { PrismaCategoryQueryRepository } from './infrastructure/repositories/prisma-category-query.repository';
import { BrandQueryRepository } from './domain/repositories/brand-query.repository';
import { PrismaBrandQueryRepository } from './infrastructure/repositories/prisma-brand-query.repository';
import { ProductQueryRepository } from './domain/repositories/product-query.repository';
import { PrismaProductQueryRepository } from './infrastructure/repositories/prisma-product-query.repository';
import { CategoriesController } from './presentation/controllers/categories.controller';
import { BrandsController } from './presentation/controllers/brands.controller';
import { ProductsController } from './presentation/controllers/products.controller';

/**
 * Products module — owns the canonical catalog and product acquisition
 * (ARCHITECTURE.md §4). Comparison presentation moved to the `compare` module;
 * this module exposes the acquisition service that compare depends on. Also
 * exposes read-only category/brand/product browsing (GET /categories, GET
 * /brands, GET /products/slug/:slug).
 */
@Module({
  controllers: [CategoriesController, BrandsController, ProductsController],
  providers: [
    ProductAcquisitionService,
    { provide: CatalogRepository, useClass: CatalogPrismaRepository },
    { provide: ProductExternalIdRepository, useClass: PrismaProductExternalIdRepository },
    { provide: CategoryQueryRepository, useClass: PrismaCategoryQueryRepository },
    { provide: BrandQueryRepository, useClass: PrismaBrandQueryRepository },
    { provide: ProductQueryRepository, useClass: PrismaProductQueryRepository },
  ],
  exports: [ProductAcquisitionService, ProductExternalIdRepository],
})
export class ProductsModule {}
