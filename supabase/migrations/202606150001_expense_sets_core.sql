-- Expense Sets core schema hardening for existing ShareExpenses databases.

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

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS join_token TEXT;

UPDATE groups
SET join_token = gen_random_uuid()::text
WHERE join_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_join_token
ON groups(join_token)
WHERE join_token IS NOT NULL;

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'miscellaneous';

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS expense_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
ADD CONSTRAINT expenses_category_check
CHECK (category IN ('lodging', 'food', 'groceries', 'fuel', 'miscellaneous'));

CREATE INDEX IF NOT EXISTS idx_expenses_group_category
ON expenses(group_id, category);

CREATE INDEX IF NOT EXISTS idx_expenses_group_date
ON expenses(group_id, expense_date DESC);

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'outside-app';

ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';

ALTER TABLE settlements
DROP CONSTRAINT IF EXISTS settlements_payment_status_check;

ALTER TABLE settlements
ADD CONSTRAINT settlements_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'confirmed'));

CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);
