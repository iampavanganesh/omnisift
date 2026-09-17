import { ApiProperty } from '@nestjs/swagger';

/**
 * Documentation-only mirror of `ProductOmniTake`
 * (shared/domain/compute-product-omni.ts). That type is an interface, so the
 * Swagger plugin can only see it as an opaque `object` — these classes give
 * the two DTOs that expose `omni` (comparison + product detail) a real schema.
 *
 * "Omni's Take" is computed deterministically from the real seller prices on
 * the response — no model call, no LLM (ADR-0002).
 */
export class OmniReasonDto {
  @ApiProperty({ enum: ['positive', 'caution'], enumName: 'OmniReasonTone' })
  tone!: 'positive' | 'caution';

  @ApiProperty()
  text!: string;
}

export class OmniTakeDto {
  @ApiProperty()
  headline!: string;

  @ApiProperty({ type: [OmniReasonDto] })
  reasons!: OmniReasonDto[];
}
