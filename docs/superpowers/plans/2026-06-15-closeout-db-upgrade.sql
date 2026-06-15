-- AI Trip Closeout database upgrade
-- Run this in Supabase SQL Editor for an existing ShareExpenses database.

-- Expense Set RLS helper functions. Older local databases may not have these yet.
CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member_user(
  target_group_id uuid,
  target_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = target_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_expense_group_member(target_expense_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = target_expense_id
      AND public.is_group_member(group_id)
  );
$$;

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'outside-app';

CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);

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

-- Force Supabase/PostgREST to refresh its schema cache immediately.
NOTIFY pgrst, 'reload schema';
