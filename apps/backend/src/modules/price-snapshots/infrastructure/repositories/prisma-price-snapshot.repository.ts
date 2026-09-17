import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  PriceSnapshotRepository,
  PriceSnapshotRow,
  SellerGraphPoint,
} from '../../domain/repositories/price-snapshot.repository';

@Injectable()
export class PrismaPriceSnapshotRepository implements PriceSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recordDaily(
    productId: string,
    lowest: number,
    highest: number,
    average: number,
  ): Promise<void> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const existing = await this.prisma.priceSnapshot.findFirst({
      where: { productId, capturedAt: { gte: startOfDay } },
      select: { id: true },
    });
    if (existing) return; // already captured today
    await this.prisma.priceSnapshot.create({ data: { productId, lowest, highest, average } });
  }

  async history(productId: string): Promise<PriceSnapshotRow[]> {
    const rows = await this.prisma.priceSnapshot.findMany({
      where: { productId },
      orderBy: { capturedAt: 'asc' },
    });
    return rows.map((r) => ({
      lowest: Number(r.lowest),
      highest: Number(r.highest),
      average: Number(r.average),
      capturedAt: r.capturedAt,
    }));
  }

  async sellerGraph(productId: string, sinceDays: number): Promise<SellerGraphPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);
    const rows = await this.prisma.sellerPriceSnapshot.findMany({
      where: { productId, capturedAt: { gte: since } },
      orderBy: { capturedAt: 'asc' },
      include: { seller: { select: { name: true } } },
    });
    return rows.map((r) => ({
      sellerId: r.sellerId,
      sellerName: r.seller.name,
      price: Number(r.price),
      mrp: r.mrp === null ? null : Number(r.mrp),
      discountPct: r.discountPct,
      capturedAt: r.capturedAt,
    }));
  }
}
