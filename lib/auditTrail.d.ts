export type AuditAction =
  | 'expense.created'
  | 'expense.updated'
  | 'expense.deleted'
  | 'member.added'
  | 'member.joined'
  | 'settlement.recorded'
  | 'closeout.generated'
  | 'expense-set.created';

export interface AuditEventInput {
  groupId: string;
  actorUserId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

export function normalizeAuditAction(action: unknown): AuditAction;
export function buildAuditEvent(input: AuditEventInput): {
  group_id: string;
  actor_user_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
};
export function insertAuditEvent(supabase: any, event: AuditEventInput): Promise<void>;
