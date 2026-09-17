import { ApiProperty } from '@nestjs/swagger';
import { CategoryWithCount } from '../../domain/repositories/category-query.repository';

export class CategoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() productCount!: number;

  static from(r: CategoryWithCount): CategoryResponseDto {
    return { id: r.id, name: r.name, slug: r.slug, productCount: r.productCount };
  }
}
