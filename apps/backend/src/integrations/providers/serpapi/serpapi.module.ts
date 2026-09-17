import { Module } from '@nestjs/common';
import { ProductProvider } from '../../../shared/interfaces/product-provider.interface';
import { SerpApiClient } from './serpapi.client';
import { SerpApiProvider } from './serpapi.provider';

/** Binds the ProductProvider port to the SerpAPI implementation. */
@Module({
  providers: [SerpApiClient, { provide: ProductProvider, useClass: SerpApiProvider }],
  exports: [ProductProvider],
})
export class SerpapiModule {}
