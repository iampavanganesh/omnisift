import { ApiProperty } from '@nestjs/swagger';
import { PriceSnapshotRow } from '../../domain/repositories/price-snapshot.repository';

export class PricePointDto {
  @ApiProperty() lowest!: number;
  @ApiProperty() highest!: number;
  @ApiProperty() average!: number;
  @ApiProperty() capturedAt!: string;

  static from(r: PriceSnapshotRow): PricePointDto {
    return {
      lowest: r.lowest,
      highest: r.highest,
      average: r.average,
      capturedAt: r.capturedAt.toISOString(),
    };
  }
}
