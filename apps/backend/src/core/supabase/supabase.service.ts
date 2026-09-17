import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/config.service';

/** Service-role Supabase client. The backend is the only holder of this key. */
@Injectable()
export class SupabaseService {
  readonly admin: SupabaseClient;
  constructor(config: AppConfigService) {
    this.admin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
