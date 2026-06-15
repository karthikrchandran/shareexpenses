const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildAuditEvent,
  normalizeAuditAction,
} = require('../lib/auditTrail.js');

test('builds a group-scoped audit event with metadata', () => {
  assert.deepEqual(
    buildAuditEvent({
      groupId: 'group-1',
      actorUserId: 'user-1',
      action: 'expense.created',
      targetType: 'expense',
      targetId: 'expense-1',
      metadata: { description: 'Dinner' },
    }),
    {
      group_id: 'group-1',
      actor_user_id: 'user-1',
      action: 'expense.created',
      target_type: 'expense',
      target_id: 'expense-1',
      metadata: { description: 'Dinner' },
    }
  );
});

test('rejects unsupported audit actions', () => {
  assert.throws(() => normalizeAuditAction('expense.read'), /Unsupported audit action/);
});

test('allows Expense Set creation audit actions', () => {
  assert.equal(normalizeAuditAction('expense-set.created'), 'expense-set.created');
});
