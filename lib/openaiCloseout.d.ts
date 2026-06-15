import type { TripCloseoutSummary } from './tripCloseout';

export function polishTripCloseoutWithAI(
  summary: TripCloseoutSummary,
  options?: {
    apiKey?: string;
    model?: string;
    fetchImpl?: typeof fetch;
  }
): Promise<{
  aiGenerated: boolean;
  aiModel: string | null;
  summary: TripCloseoutSummary;
}>;
