import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { NotFoundError } from '../../../../core/errors/app-error';
import { ProductQueryRepository } from '../../domain/repositories/product-query.repository';
import { ProductDetailResponseDto } from '../../application/dto/product-detail-response.dto';
import { SimilarProductResponseDto } from '../../application/dto/similar-product-response.dto';
import { VariantSiblingResponseDto } from '../../application/dto/variant-sibling-response.dto';
import {
  similarProductSchema,
  type SimilarProductInput,
} from '../validators/similar-product.schemas';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productQuery: ProductQueryRepository) {}

  // Deliberately NOT a bare `:slug` catch-all under /products: CompareByProductController
  // (in the `compare` module, which depends on and so initializes after this one)
  // registers `/products/compare-by-product`, and CompareLegacyController registers
  // `/products/comparison` — a `:slug` route here would shadow both regardless of
  // module init order. This literal `slug/` segment sidesteps that hazard entirely.
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Product detail by slug',
    description:
      'Public (guest). `omni` is a deterministic explanation computed from the real seller prices — no model call. No stock/availability field is returned: the provider supplies no such signal.',
  })
  @ApiParam({ name: 'slug', description: 'Canonical product slug.' })
  @ApiEnvelopeOk(ProductDetailResponseDto)
  @ApiErrors('notFound')
  async detail(@Param('slug') slug: string) {
    const detail = await this.productQuery.getBySlug(slug);
    if (!detail) throw new NotFoundError('Product not found.');
    return ApiResponse.ok(ProductDetailResponseDto.from(detail));
  }

  // `:id/similar` is a two-segment path, so it can't collide with the one-segment
  // literal routes (`compare-by-product`, `comparison`) regardless of registration
  // order — no need for the same `slug/` workaround as above.
  @Get(':id/similar')
  @ApiOperation({
    summary: 'Similar products',
    description: 'Public (guest). Empty array when the product has no real similar matches.',
  })
  @ApiParam({ name: 'id', description: 'Internal product UUID.' })
  @ApiZodQuery(similarProductSchema, { limit: 'Maximum rows to return.' })
  @ApiEnvelopeOk(SimilarProductResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('validation', 'notFound')
  async similar(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(similarProductSchema)) query: SimilarProductInput,
  ) {
    const rows = await this.productQuery.getSimilar(id, query.limit);
    if (rows === null) throw new NotFoundError('Product not found.');
    return ApiResponse.ok(rows.map(SimilarProductResponseDto.from), { count: rows.length });
  }

  @Get(':id/variant-siblings')
  @ApiOperation({
    summary: 'Other variants of the same base model',
    description:
      'Public (guest). Real sibling listings (different colour/storage), each with its own real price. Commonly empty.',
  })
  @ApiParam({ name: 'id', description: 'Internal product UUID.' })
  @ApiEnvelopeOk(VariantSiblingResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('notFound')
  async variantSiblings(@Param('id') id: string) {
    const siblings = await this.productQuery.getVariantSiblings(id);
    if (siblings === null) throw new NotFoundError('Product not found.');
    return ApiResponse.ok(siblings.map(VariantSiblingResponseDto.from), {
      count: siblings.length,
    });
  }
}
