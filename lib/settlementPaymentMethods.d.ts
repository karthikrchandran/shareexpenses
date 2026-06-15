export type SettlementPaymentMethodId = 'outside-app' | 'venmo';

export interface SettlementPaymentMethod {
  id: SettlementPaymentMethodId;
  label: string;
  description: string;
  disabled: boolean;
}

export function getSettlementPaymentMethods(options?: {
  venmoConfigured?: boolean;
}): SettlementPaymentMethod[];

export function buildOutsideAppSettlementMessage(input: {
  recipientName: string;
  amount: number;
}): string;
