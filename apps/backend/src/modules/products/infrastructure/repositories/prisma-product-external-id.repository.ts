// C:\omnisift_final\apps\backend\src\modules\products\infrastructure\repositories\prisma-product-external-id.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { ProductExternalIdRepository } from '../../domain/repositories/product-external-id.repository';

@Injectable()
export class PrismaProductExternalIdRepository implements ProductExternalIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async link(productId: string, provider: string, externalId: string): Promise<void> {
    if (!productId || !externalId) return;
    await this.prisma.productExternalId.upsert({
      where: { provider_externalId: { provider, externalId } },
      create: { productId, provider, externalId },
      update: { productId }, // re-point if the same external id ever maps anew
    });
  }

  async resolve(provider: string, externalId: string): Promise<string | null> {
    const row = await this.prisma.productExternalId.findUnique({
      where: { provider_externalId: { provider, externalId } },
      select: { productId: true },
    });
    return row?.productId ?? null;
  }

  async resolveMany(provider: string, externalIds: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (externalIds.length === 0) return out;
    const rows = await this.prisma.productExternalId.findMany({
      where: { provider, externalId: { in: externalIds } },
      select: { productId: true, externalId: true },
    });
    for (const r of rows) out.set(r.externalId, r.productId);
    return out;
  }
}
