// C:\omnisift_final\apps\backend\src\modules\alerts\application\usecases\delete-price-alert.usecase.ts
import { Injectable } from '@nestjs/common';
import { PriceAlertRepository } from '../../domain/repositories/price-alert.repository';

@Injectable()
export class DeletePriceAlertUseCase {
  constructor(private readonly repo: PriceAlertRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    await this.repo.delete(userId, id);
  }
}
