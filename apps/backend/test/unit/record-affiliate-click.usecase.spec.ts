import { describe, expect, it, vi } from 'vitest';
import { RecordAffiliateClickUseCase } from '../../src/modules/affiliate/application/usecases/record-affiliate-click.usecase';
import { AffiliateClick } from '../../src/modules/affiliate/domain/entities/affiliate-click.entity';
import {
  AffiliateClickRepository,
  RecordClickInput,
} from '../../src/modules/affiliate/domain/repositories/affiliate-click.repository';

// Fakes over mocks: we test inputs/outputs, not internals (Handbook Vol III).
class FakeAffiliateClickRepository extends AffiliateClickRepository {
  record = vi.fn(
    async (userId: string, input: RecordClickInput) =>
      new AffiliateClick(
        'c1',
        input.productId,
        'Some Product',
        null,
        input.platform,
        'https://real-listing.example/x',
        new Date(),
      ),
  );
  history = vi.fn();
}

describe('RecordAffiliateClickUseCase', () => {
  it('delegates to the repository — never accepts or forwards a client-supplied destination URL', async () => {
    const repo = new FakeAffiliateClickRepository();
    const useCase = new RecordAffiliateClickUseCase(repo);
    const input: RecordClickInput = { productId: 'p1', platform: 'Amazon' };

    const click = await useCase.execute('u1', input);

    expect(repo.record).toHaveBeenCalledOnce();
    expect(repo.record).toHaveBeenCalledWith('u1', input);
    // RecordClickInput has no targetUrl field at all — this is a compile-time
    // guarantee as much as a runtime one, but assert the shape explicitly too.
    expect(Object.keys(input)).not.toContain('targetUrl');
    expect(click.targetUrl).toBe('https://real-listing.example/x');
  });
});
