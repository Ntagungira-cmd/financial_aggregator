export class LatestRatesResponseDto {
  success: boolean;
  data: {
    base: string | undefined;
    rates: Record<string, number>;
    timestamp: string;
  };
}
