import { Injectable } from '@nestjs/common';
import { AffiliateClick } from '../../domain/entities/affiliate-click.entity';
import {
  AffiliateClickRepository,
  RecordClickInput,
} from '../../domain/repositories/affiliate-click.repository';

@Injectable()
export class RecordAffiliateClickUseCase {
  constructor(private readonly repo: AffiliateClickRepository) {}

  execute(userId: string, input: RecordClickInput): Promise<AffiliateClick> {
    return this.repo.record(userId, input);
  }
}
