export interface ExchangeRateApiResponse {
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
  time_last_update_utc: string;
}
