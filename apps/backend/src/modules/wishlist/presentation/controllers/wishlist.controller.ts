import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { OkResultDto, WishlistMetaDto } from '../../../../shared/dto/common-response.dto';
import {
  ApiEnvelopeCreated,
  ApiEnvelopeOk,
} from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { ApiZodBody } from '../../../../shared/openapi/api-zod.decorator';
import { ZodValidationPipe } from '../../../../core/validation/zod-validation.pipe';
import { JwtAuthGuard, type AuthUser } from '../../../../core/security/jwt-auth.guard';
import { CurrentUser } from '../../../../core/security/current-user.decorator';
import { AddToWishlistUseCase } from '../../application/usecases/add-to-wishlist.usecase';
import { RemoveFromWishlistUseCase } from '../../application/usecases/remove-from-wishlist.usecase';
import { GetWishlistUseCase } from '../../application/usecases/get-wishlist.usecase';
import { WishlistItemResponseDto } from '../../application/dto/wishlist-item-response.dto';
import { saveWishlistSchema, type SaveWishlistBody } from '../validators/wishlist.schemas';

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(
    private readonly addUseCase: AddToWishlistUseCase,
    private readonly removeUseCase: RemoveFromWishlistUseCase,
    private readonly getUseCase: GetWishlistUseCase,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the saved products of the signed-in user',
    description:
      'Requires authentication. Each item carries the price frozen at save time; currentPrice is the live cached price, or null when not currently cached.',
  })
  @ApiEnvelopeOk(WishlistItemResponseDto, { isArray: true, meta: WishlistMetaDto })
  @ApiErrors('auth')
  async list(@CurrentUser() user: AuthUser) {
    const [withPrices, max] = await Promise.all([
      this.getUseCase.execute(user.id),
      this.runtimeConfig.getWishlistMaxItems(),
    ]);
    // Each entry = { item, currentPrice }. Saved price is frozen on the item;
    // currentPrice is live from search_cache (null if not currently cached).
    return ApiResponse.ok(
      withPrices.map((w) => WishlistItemResponseDto.from(w.item, w.currentPrice)),
      { count: withPrices.length, max },
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Save a product to the wishlist',
    description:
      'Requires authentication. Rejected with 422 once the per-user cap (meta.max on GET) is reached.',
  })
  @ApiZodBody(saveWishlistSchema)
  @ApiEnvelopeCreated(WishlistItemResponseDto)
  @ApiErrors('validation', 'auth', 'businessRule')
  async add(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(saveWishlistSchema)) body: SaveWishlistBody,
  ) {
    const item = await this.addUseCase.execute(user.id, body);
    // On add, currentPrice = the just-saved price (no lookup needed).
    return ApiResponse.ok(WishlistItemResponseDto.from(item, item.price));
  }

  @Delete(':productId')
  @ApiOperation({
    summary: 'Remove one saved product',
    description:
      'Requires authentication. Idempotent — removing something absent still reports ok.',
  })
  @ApiParam({ name: 'productId', description: 'Product id as stored on the wishlist item.' })
  @ApiEnvelopeOk(OkResultDto)
  @ApiErrors('auth')
  async remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    await this.removeUseCase.execute(user.id, productId);
    return ApiResponse.ok({ ok: true });
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the whole wishlist', description: 'Requires authentication.' })
  @ApiEnvelopeOk(OkResultDto)
  @ApiErrors('auth')
  async clearAll(@CurrentUser() user: AuthUser) {
    await this.removeUseCase.clearAll(user.id);
    return ApiResponse.ok({ ok: true });
  }
}
