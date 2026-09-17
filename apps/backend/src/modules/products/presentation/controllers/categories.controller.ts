import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodQuery } from '../../../../shared/openapi/api-zod.decorator';
import { CATALOG_DETAIL_QUERY_DOCS } from '../validators/catalog-detail.docs';
import { CategoryFacetDto } from '../../application/dto/category-facet-response.dto';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { NotFoundError } from '../../../../core/errors/app-error';
import { CategoryQueryRepository } from '../../domain/repositories/category-query.repository';
import { CategoryResponseDto } from '../../application/dto/category-response.dto';
import { CategoryDetailResponseDto } from '../../application/dto/category-detail-response.dto';
import { catalogDetailSchema, type CatalogDetailInput } from '../validators/catalog-detail.schemas';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly repo: CategoryQueryRepository) {}

  @Get()
  @ApiOperation({ summary: 'All categories with product counts', description: 'Public (guest).' })
  @ApiEnvelopeOk(CategoryResponseDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors()
  async list() {
    const rows = await this.repo.listWithCounts();
    return ApiResponse.ok(rows.map(CategoryResponseDto.from), { count: rows.length });
  }

  @Get(':slug/facets')
  @ApiOperation({
    summary: 'Filterable spec facets for a category',
    description:
      'Public (guest). Data-driven from the specs real products in this category carry — not a hardcoded taxonomy. Values feed the `specs` query parameter.',
  })
  @ApiParam({ name: 'slug', description: 'Category slug.' })
  @ApiEnvelopeOk(CategoryFacetDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors('notFound')
  async facets(@Param('slug') slug: string) {
    const facets = await this.repo.getFacets(slug);
    if (facets === null) throw new NotFoundError('Category not found.');
    return ApiResponse.ok(facets, { count: facets.length });
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Category detail: products, insights, brands, top deal',
    description:
      'Public (guest). `topDeal` is the highest advertised discount off list price, not a drop measured against an earlier OmniSift price.',
  })
  @ApiParam({ name: 'slug', description: 'Category slug.' })
  @ApiZodQuery(catalogDetailSchema, CATALOG_DETAIL_QUERY_DOCS)
  @ApiEnvelopeOk(CategoryDetailResponseDto)
  @ApiErrors('validation', 'notFound')
  async detail(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(catalogDetailSchema)) query: CatalogDetailInput,
  ) {
    const detail = await this.repo.getDetail(slug, query);
    if (!detail) throw new NotFoundError('Category not found.');
    return ApiResponse.ok(CategoryDetailResponseDto.from(detail));
  }
}
