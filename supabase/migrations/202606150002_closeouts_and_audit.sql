-- AI Trip Closeout and Expense Set activity audit trail.

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read Expense Set audit events" ON audit_events;
CREATE POLICY "Members can read Expense Set audit events" ON audit_events
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "Members can create Expense Set audit events" ON audit_events;
CREATE POLICY "Members can create Expense Set audit events" ON audit_events
  FOR INSERT WITH CHECK (
    auth.uid() = actor_user_id
    AND public.is_group_member(group_id)
  );

CREATE INDEX IF NOT EXISTS idx_audit_events_group_created
ON audit_events(group_id, created_at DESC);

CREATE TABLE IF NOT EXISTS expense_set_closeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_json JSONB NOT NULL,
  ai_model TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expense_set_closeouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read Expense Set closeouts" ON expense_set_closeouts;
CREATE POLICY "Members can read Expense Set closeouts" ON expense_set_closeouts
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "Members can create Expense Set closeouts" ON expense_set_closeouts;
CREATE POLICY "Members can create Expense Set closeouts" ON expense_set_closeouts
  FOR INSERT WITH CHECK (
    auth.uid() = generated_by
    AND public.is_group_member(group_id)
  );

CREATE INDEX IF NOT EXISTS idx_closeouts_group_created
ON expense_set_closeouts(group_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
