// C:\omnisift_final\apps\backend\src\modules\alerts\infrastructure\repositories\prisma-price-alert.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AlertType, PriceAlert } from '../../domain/entities/price-alert.entity';
import {
  CreatePriceAlertInput,
  PriceAlertRepository,
} from '../../domain/repositories/price-alert.repository';

@Injectable()
export class PrismaPriceAlertRepository implements PriceAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, input: CreatePriceAlertInput): Promise<PriceAlert> {
    const row = await this.prisma.priceAlert.upsert({
      where: {
        userId_productId_type: {
          userId,
          productId: input.productId,
          type: input.type,
        },
      },
      update: {
        targetPrice: input.targetPrice,
        isActive: true,
      },
      create: {
        userId,
        productId: input.productId,
        type: input.type,
        targetPrice: input.targetPrice,
        isActive: true,
      },
      include: { product: { select: { title: true, primaryImageUrl: true } } },
    });
    return this.toEntity(row);
  }

  async list(userId: string): Promise<PriceAlert[]> {
    const rows = await this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { title: true, primaryImageUrl: true } } },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.prisma.priceAlert.deleteMany({ where: { id, userId } });
  }

  async setActive(userId: string, id: string, isActive: boolean): Promise<PriceAlert | null> {
    // Reactivating clears the previous fire's state, so a re-enabled alert
    // isn't silently blocked from ever notifying again just because the
    // price hasn't moved further since the last time it fired (ANY_DROP
    // requires a fresh baseline; BELOW_TARGET requires re-arming below the
    // last notified price — see PriceAlertCheckerService.evaluate()).
    const res = await this.prisma.priceAlert.updateMany({
      where: { id, userId },
      data: isActive ? { isActive, lastNotifiedPrice: null, lastTriggeredAt: null } : { isActive },
    });
    if (res.count === 0) return null;
    const row = await this.prisma.priceAlert.findFirst({
      where: { id, userId },
      include: { product: { select: { title: true, primaryImageUrl: true } } },
    });
    return row ? this.toEntity(row) : null;
  }

  // --- checker (Stage 3) ---

  async findActiveByProduct(productId: string): Promise<PriceAlert[]> {
    const rows = await this.prisma.priceAlert.findMany({
      where: { productId, isActive: true }, // uses @@index([productId, isActive])
      include: { product: { select: { title: true, primaryImageUrl: true } } },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findDistinctActiveProductIds(): Promise<string[]> {
    const rows = await this.prisma.priceAlert.findMany({
      where: { isActive: true },
      distinct: ['productId'],
      select: { productId: true },
      orderBy: { productId: 'asc' },
    });
    return rows.map((r) => r.productId);
  }

  async markTriggered(id: string, notifiedPrice: number, at: Date): Promise<void> {
    await this.prisma.priceAlert.update({
      where: { id },
      data: { lastNotifiedPrice: notifiedPrice, lastTriggeredAt: at },
    });
  }

  async setBaseline(id: string, price: number): Promise<void> {
    await this.prisma.priceAlert.update({
      where: { id },
      data: { lastNotifiedPrice: price },
    });
  }

  private toEntity(r: {
    id: string;
    userId: string;
    productId: string;
    type: string;
    targetPrice: unknown;
    isActive: boolean;
    lastTriggeredAt: Date | null;
    lastNotifiedPrice: unknown;
    createdAt: Date;
    updatedAt: Date;
    product?: { title: string; primaryImageUrl: string | null } | null;
  }): PriceAlert {
    return new PriceAlert(
      r.id,
      r.userId,
      r.productId,
      r.type as AlertType,
      r.targetPrice == null ? null : Number(r.targetPrice),
      r.isActive,
      r.lastTriggeredAt,
      r.lastNotifiedPrice == null ? null : Number(r.lastNotifiedPrice),
      r.createdAt,
      r.updatedAt,
      r.product?.title ?? null,
      r.product?.primaryImageUrl ?? null,
    );
  }
}
