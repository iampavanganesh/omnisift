// C:\omnisift_final\apps\backend\src\modules\alerts\application\usecases\create-price-alert.usecase.ts
import { Injectable } from '@nestjs/common';
import { BusinessRuleError } from '../../../../core/errors/app-error';
import { PriceAlert } from '../../domain/entities/price-alert.entity';
import {
  CreatePriceAlertInput,
  PriceAlertRepository,
} from '../../domain/repositories/price-alert.repository';

@Injectable()
export class CreatePriceAlertUseCase {
  constructor(private readonly repo: PriceAlertRepository) {}

  async execute(userId: string, input: CreatePriceAlertInput): Promise<PriceAlert> {
    // Zod already enforces this, but guard here too (defence in depth).
    if (input.type === 'BELOW_TARGET' && (input.targetPrice == null || input.targetPrice <= 0)) {
      throw new BusinessRuleError('A target price above 0 is required for BELOW_TARGET alerts.');
    }
    // ANY_DROP never carries a target — normalise so we never store a stray value.
    const clean: CreatePriceAlertInput = {
      ...input,
      targetPrice: input.type === 'BELOW_TARGET' ? input.targetPrice : null,
    };
    return this.repo.upsert(userId, clean);
  }
}
