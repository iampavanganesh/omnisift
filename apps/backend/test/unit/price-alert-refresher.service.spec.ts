import { describe, expect, it, vi } from 'vitest';
import { PriceAlertRefresherService } from '../../src/modules/alerts/application/services/price-alert-refresher.service';
import {
  PriceAlertRepository,
  CreatePriceAlertInput,
} from '../../src/modules/alerts/domain/repositories/price-alert.repository';
import { PriceAlert } from '../../src/modules/alerts/domain/entities/price-alert.entity';
import { GetComparisonByProductUseCase } from '../../src/modules/compare/application/usecases/get-comparison-by-product.usecase';
import { RuntimeConfigService } from '../../src/core/config/runtime-config.service';

// Fakes over mocks: we test inputs/outputs, not internals (Handbook Vol III).
class FakeAlertsRepo extends PriceAlertRepository {
  productIds: string[] = [];
  upsert = vi.fn(async (_u: string, _i: CreatePriceAlertInput) => ({}) as PriceAlert);
  list = vi.fn();
  delete = vi.fn();
  setActive = vi.fn();
  findActiveByProduct = vi.fn();
  markTriggered = vi.fn();
  setBaseline = vi.fn();

  findDistinctActiveProductIds = vi.fn(async () => this.productIds);
}

function fakeRuntimeConfig(cap: number): RuntimeConfigService {
  return { getAlertRefreshBatchCap: vi.fn(async () => cap) } as unknown as RuntimeConfigService;
}

describe('PriceAlertRefresherService', () => {
  it('skips a run entirely when the previous run is still in progress', async () => {
    const alerts = new FakeAlertsRepo();
    alerts.productIds = ['p1'];
    const useCase = {
      execute: vi.fn(async () => ({ refreshed: true })),
    } as unknown as GetComparisonByProductUseCase;
    const service = new PriceAlertRefresherService(alerts, useCase, fakeRuntimeConfig(20));

    // Both calls issued in the same synchronous tick — `running` is set
    // synchronously before either call's first await, so the second call's
    // guard sees it already true and never reaches execute().
    const [first, second] = [service.run(), service.run()];
    await Promise.all([first, second]);

    expect(useCase.execute).toHaveBeenCalledOnce();
  });

  it('isolates a per-product failure — one bad product never stops the batch', async () => {
    const alerts = new FakeAlertsRepo();
    alerts.productIds = ['bad', 'good'];
    const useCase = {
      execute: vi.fn(async (productId: string) => {
        if (productId === 'bad') throw new Error('provider exploded');
        return { refreshed: true };
      }),
    } as unknown as GetComparisonByProductUseCase;
    const service = new PriceAlertRefresherService(alerts, useCase, fakeRuntimeConfig(20));

    await expect(service.run()).resolves.toBeUndefined();
    expect(useCase.execute).toHaveBeenCalledTimes(2);
    expect(useCase.execute).toHaveBeenCalledWith('bad');
    expect(useCase.execute).toHaveBeenCalledWith('good');
  });

  it('stops issuing refreshes once the batch cap is reached, without erroring on the rest', async () => {
    const alerts = new FakeAlertsRepo();
    alerts.productIds = ['p1', 'p2', 'p3'];
    const useCase = {
      execute: vi.fn(async () => ({ refreshed: true })),
    } as unknown as GetComparisonByProductUseCase;
    const service = new PriceAlertRefresherService(alerts, useCase, fakeRuntimeConfig(2));

    await service.run();

    expect(useCase.execute).toHaveBeenCalledTimes(2);
  });

  it('does not count a cache-hit (not refreshed) against the batch cap', async () => {
    const alerts = new FakeAlertsRepo();
    alerts.productIds = ['p1', 'p2', 'p3'];
    const useCase = {
      execute: vi.fn(async (productId: string) => ({ refreshed: productId !== 'p1' })),
    } as unknown as GetComparisonByProductUseCase;
    const service = new PriceAlertRefresherService(alerts, useCase, fakeRuntimeConfig(2));

    await service.run();

    // p1 = fresh cache hit (doesn't count), p2 + p3 = real refreshes (cap = 2, both fit).
    expect(useCase.execute).toHaveBeenCalledTimes(3);
  });
});
