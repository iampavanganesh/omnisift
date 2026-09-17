export const CACHE_TTL = {
  SEARCH_DAYS: 7,
  COMPARE_HOURS: 24,
} as const;

export const PAGINATION = {
  PAGE_SIZE: 20,
  MAX_PAGES: 4, // auto-scroll stops after this many pages (change this one number to adjust)
} as const;

export const ALERTS = {
  // Conservative default for the price-alert refresh cron — max products
  // actually refreshed against the provider (SerpAPI) per run. Products whose
  // cached comparison is still fresh cost 0 API calls and don't count against
  // this cap, so it only bounds real spend, not the candidate scan.
  REFRESH_BATCH_CAP: 20,
} as const;
