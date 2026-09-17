import { Injectable } from '@nestjs/common';
import { SuggestClient } from '../../infrastructure/suggest.client';

@Injectable()
export class GetSuggestionsUseCase {
  constructor(private readonly client: SuggestClient) {}
  execute(query: string): Promise<string[]> {
    return this.client.suggest(query);
  }
}
