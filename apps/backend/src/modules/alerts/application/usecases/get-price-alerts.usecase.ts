// C:\omnisift_final\apps\backend\src\modules\alerts\application\usecases\get-price-alerts.usecase.ts
import { Injectable } from '@nestjs/common';
import { PriceAlert } from '../../domain/entities/price-alert.entity';
import { PriceAlertRepository } from '../../domain/repositories/price-alert.repository';

@Injectable()
export class GetPriceAlertsUseCase {
  constructor(private readonly repo: PriceAlertRepository) {}

  execute(userId: string): Promise<PriceAlert[]> {
    return this.repo.list(userId);
  }
}
