import { Controller, Get, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RuntimeConfigService } from '../../core/config/runtime-config.service';
import { ApiErrors } from '../../shared/openapi/api-errors.decorator';
import { RuntimeConfigResponseDto } from './runtime-config-response.dto';

/**
 * Public runtime config for the client. The app calls GET /config on startup and
 * uses these values to shape its behavior WITHOUT a rebuild — e.g. the per-query
 * API-call budget. Add a field here per app-facing setting; keep it small + non-secret.
 */
@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly runtimeConfig: RuntimeConfigService) {}

  @Version('1')
  @Get()
  @ApiOperation({
    summary: 'Public runtime configuration',
    description:
      'Public (guest). NOTE: unlike every other endpoint, this route returns its fields at the TOP LEVEL — it is not wrapped in the { success, data, meta } envelope. Documented as-is; see OPENAPI_CONTRACT_REPORT.md.',
  })
  @ApiOkResponse({ type: RuntimeConfigResponseDto, description: 'Unwrapped — no envelope.' })
  @ApiErrors()
  async getConfig(): Promise<{ maxApiCalls: number; priceGraphEnabled: boolean }> {
    return {
      maxApiCalls: await this.runtimeConfig.getMaxApiCalls(),
      priceGraphEnabled: await this.runtimeConfig.getPriceGraphEnabled(),
    };
  }
}
