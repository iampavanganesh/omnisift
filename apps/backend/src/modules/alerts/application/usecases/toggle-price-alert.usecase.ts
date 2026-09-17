// C:\omnisift_final\apps\backend\src\modules\alerts\application\usecases\toggle-price-alert.usecase.ts
import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../core/errors/app-error';
import { PriceAlert } from '../../domain/entities/price-alert.entity';
import { PriceAlertRepository } from '../../domain/repositories/price-alert.repository';

@Injectable()
export class TogglePriceAlertUseCase {
  constructor(private readonly repo: PriceAlertRepository) {}

  async execute(userId: string, id: string, isActive: boolean): Promise<PriceAlert> {
    const updated = await this.repo.setActive(userId, id, isActive);
    if (!updated) throw new NotFoundError('Alert not found.');
    return updated;
  }
}
