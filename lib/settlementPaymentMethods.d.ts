export type SettlementPaymentMethodId = 'outside-app' | 'venmo' | 'cash-app';

export interface SettlementPaymentMethod {
  id: SettlementPaymentMethodId;
  label: string;
  description: string;
  disabled: boolean;
}

export function getSettlementPaymentMethods(): SettlementPaymentMethod[];

export function buildOutsideAppSettlementMessage(input: {
  recipientName: string;
  amount: number;
}): string;

export type SettlementStatus = 'pending' | 'paid' | 'confirmed';

export function buildPaymentHandoffMessage(input: {
  methodLabel: string;
  recipientName: string;
  amount: number;
  paymentStatus: SettlementStatus;
}): string;

export function normalizeSettlementStatus(status?: unknown): SettlementStatus;
