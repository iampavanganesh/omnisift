import { Injectable } from '@nestjs/common';
import {
  AffiliateClickHistoryPage,
  AffiliateClickRepository,
} from '../../domain/repositories/affiliate-click.repository';

@Injectable()
export class GetAffiliateClickHistoryUseCase {
  constructor(private readonly repo: AffiliateClickRepository) {}

  execute(userId: string, page: number, pageSize: number): Promise<AffiliateClickHistoryPage> {
    return this.repo.history(userId, page, pageSize);
  }
}
