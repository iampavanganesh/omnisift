import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { CATALOG_DETAIL_QUERY_DOCS } from '../validators/catalog-detail.docs';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { NotFoundError } from '../../../../core/errors/app-error';
import { BrandQueryRepository } from '../../domain/repositories/brand-query.repository';
import { BrandResponseDto } from '../../application/dto/brand-response.dto';
import { BrandDetailResponseDto } from '../../application/dto/brand-detail-response.dto';
import { catalogDetailSchema, type CatalogDetailInput } from '../validators/catalog-detail.schemas';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly repo: BrandQueryRepository) {}

  @Get()
  @ApiOperation({ summary: 'All brands with product counts', description: 'Public (guest).' })
  @ApiEnvelopeOk(BrandResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors()
  async list() {
    const rows = await this.repo.listWithCounts();
    return ApiResponse.ok(rows.map(BrandResponseDto.from), { count: rows.length });
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Brand detail: products, insights, categories, top deal',
    description:
      'Public (guest). `topDeal` is the highest advertised discount off list price, not a drop measured against an earlier OmniSift price.',
  })
  @ApiParam({ name: 'slug', description: 'Brand slug.' })
  @ApiZodQuery(catalogDetailSchema, CATALOG_DETAIL_QUERY_DOCS)
  @ApiEnvelopeOk(BrandDetailResponseDto)
  @ApiErrors('validation', 'notFound')
  async detail(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(catalogDetailSchema)) query: CatalogDetailInput,
  ) {
    const detail = await this.repo.getDetail(slug, query);
    if (!detail) throw new NotFoundError('Brand not found.');
    return ApiResponse.ok(BrandDetailResponseDto.from(detail));
  }
}
