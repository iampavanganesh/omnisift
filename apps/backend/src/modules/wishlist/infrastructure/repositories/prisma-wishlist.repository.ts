import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { WishlistItem } from '../../domain/entities/wishlist-item.entity';
import {
  SaveWishlistInput,
  WishlistRepository,
} from '../../domain/repositories/wishlist.repository';

@Injectable()
export class PrismaWishlistRepository implements WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, input: SaveWishlistInput): Promise<WishlistItem> {
    const row = await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: input.productId } },
      update: {
        price: input.price,
        title: input.title,
        imageUrl: input.imageUrl,
        token: input.token,
      },
      create: { userId, ...input },
    });
    return this.toEntity(row);
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  }

  /** Remove ALL of this user's wishlist items (the "Clear all" action). */
  async clearAll(userId: string): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({ where: { userId } });
  }

  async list(userId: string): Promise<WishlistItem[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  /** How many products this user has saved (for the limit + the count/max UI). */
  async count(userId: string): Promise<number> {
    return this.prisma.wishlistItem.count({ where: { userId } });
  }

  /** Is this product already saved by this user? (a re-save isn't a new item.) */
  async exists(userId: string, productId: string): Promise<boolean> {
    const row = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    return row !== null;
  }

  private toEntity(r: {
    id: string;
    productId: string;
    token: string;
    title: string;
    imageUrl: string;
    price: unknown;
    platform: string;
    productUrl: string;
    createdAt: Date;
  }): WishlistItem {
    return new WishlistItem(
      r.id,
      r.productId,
      r.token,
      r.title,
      r.imageUrl,
      Number(r.price),
      r.platform,
      r.productUrl,
      r.createdAt,
    );
  }
}
