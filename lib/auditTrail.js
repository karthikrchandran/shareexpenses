const AUDIT_ACTIONS = new Set([
  'expense.created',
  'expense.updated',
  'expense.deleted',
  'member.added',
  'member.joined',
  'settlement.recorded',
  'closeout.generated',
  'expense-set.created',
]);

function normalizeAuditAction(action) {
  if (!AUDIT_ACTIONS.has(action)) {
    throw new Error('Unsupported audit action');
  }

  return action;
}

function buildAuditEvent({
  groupId,
  actorUserId,
  action,
  targetType,
  targetId,
  metadata = {},
}) {
  if (!groupId || !actorUserId || !targetType) {
    throw new Error('Audit event requires groupId, actorUserId, and targetType');
  }

  return {
    group_id: groupId,
    actor_user_id: actorUserId,
    action: normalizeAuditAction(action),
    target_type: targetType,
    target_id: targetId || null,
    metadata,
  };
}

async function insertAuditEvent(supabase, event) {
  const { error } = await supabase
    .from('audit_events')
    .insert(buildAuditEvent(event));

  if (error) {
    console.error('Audit event insert failed:', error);
  }
}

module.exports = {
  buildAuditEvent,
  insertAuditEvent,
  normalizeAuditAction,
};
