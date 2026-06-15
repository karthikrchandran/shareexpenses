# Expense Sets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build mandatory Expense Sets as the membership boundary for expenses, splits, and dashboard settlements.

**Architecture:** Keep the physical Supabase tables `groups` and `group_members`, but expose them in the app as Expense Sets. Centralize security-sensitive validation in pure helpers and API routes because the service role client bypasses RLS. Keep the dashboard as a single `/dashboard` experience with selected Expense Set state.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Supabase, Tailwind CSS, Node's built-in test runner for pure helper tests.

---

## File Structure

- Create `lib/expenseSetAccess.js`: pure validation helpers for required set ids, membership checks, split participant checks, and payer-only mutation checks.
- Create `lib/expenseSetAccess.d.ts`: TypeScript declarations for the helper module.
- Create `tests/expenseSetAccess.test.cjs`: Node test coverage for the security-sensitive helper behavior.
- Modify `package.json`: use `node --test tests/*.test.cjs`.
- Create `app/api/expense-sets/route.ts`: list and create Expense Sets for a signed-in user id supplied by the current app.
- Create `app/api/expense-sets/[id]/members/route.ts`: list members and add existing registered users when the actor is already a member.
- Modify `app/api/expenses/route.ts`: require `group_id`, create expense and splits together, and list expenses only after membership validation.
- Modify `app/api/expenses/[id]/route.ts`: preserve payer-only update/delete and add membership/split validation.
- Modify `components/AddExpenseModal.tsx`: require `expenseSetId`, use selected-set members for split selection, and create expenses through the API.
- Create `components/CreateExpenseSetModal.tsx`: create a set with a name and optional existing registered members.
- Create `components/ManageExpenseSetMembersModal.tsx`: allow any current set member to add registered users.
- Modify `app/dashboard/page.tsx`: load sets, selected set members, scoped expenses, and wire the new modal actions.
- Modify `components/ExpenseList.tsx`: keep payer-only edit/delete controls and tolerate scoped refreshes.
- Modify `components/SettlementSummary.tsx`: keep settlement math scoped by receiving only selected-set expenses.
- Modify `lib/types.ts`: add UI-facing `ExpenseSet` and `ExpenseSetMember` aliases while preserving existing table shape.
- Modify `SETUP.md`: update schema and RLS guidance for mandatory Expense Sets.

## Task 1: Add Failing Access Tests

**Files:**
- Modify: `package.json`
- Create: `tests/expenseSetAccess.test.cjs`

- [ ] **Step 1: Add test script**

In `package.json`, set:

```json
"test": "node --test tests/*.test.cjs"
```

Expected: `npm test` runs Node's built-in test runner.

- [ ] **Step 2: Write failing tests**

Create `tests/expenseSetAccess.test.cjs`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ensureActorCanMutateExpense,
  validateExpenseSetId,
  validateSplitParticipants,
} = require('../lib/expenseSetAccess.js');

test('requires every expense to belong to an Expense Set', () => {
  assert.throws(() => validateExpenseSetId(undefined), /Expense Set is required/);
  assert.throws(() => validateExpenseSetId(''), /Expense Set is required/);
  assert.equal(validateExpenseSetId('set-1'), 'set-1');
});

test('allows splits among current members of the selected Expense Set', () => {
  assert.doesNotThrow(() =>
    validateSplitParticipants(
      [{ user_id: 'alice', amount: 12 }, { user_id: 'bob', amount: 8 }],
      ['alice', 'bob', 'chris']
    )
  );
});

test('rejects split participants outside the selected Expense Set', () => {
  assert.throws(
    () =>
      validateSplitParticipants(
        [{ user_id: 'alice', amount: 12 }, { user_id: 'mallory', amount: 8 }],
        ['alice', 'bob']
      ),
    /Split participants must be members of this Expense Set/
  );
});

test('allows only the payer to edit or delete their expense', () => {
  assert.doesNotThrow(() =>
    ensureActorCanMutateExpense({ paid_by_user_id: 'alice' }, 'alice', 'edit')
  );

  assert.throws(
    () => ensureActorCanMutateExpense({ paid_by_user_id: 'alice' }, 'bob', 'delete'),
    /Only the expense payer can delete this expense/
  );
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npm test
```

Expected: FAIL because `../lib/expenseSetAccess.js` does not exist.

## Task 2: Implement Access Helpers

**Files:**
- Create: `lib/expenseSetAccess.js`
- Create: `lib/expenseSetAccess.d.ts`
- Test: `tests/expenseSetAccess.test.cjs`

- [ ] **Step 1: Add minimal implementation**

Create `lib/expenseSetAccess.js`:

```js
function validateExpenseSetId(expenseSetId) {
  if (!expenseSetId || expenseSetId.trim().length === 0) {
    throw new Error('Expense Set is required');
  }

  return expenseSetId;
}

function validateSplitParticipants(splits, memberIds) {
  const memberSet = new Set(memberIds);
  const hasInvalidParticipant = splits.some((split) => !memberSet.has(split.user_id));

  if (hasInvalidParticipant) {
    throw new Error('Split participants must be members of this Expense Set');
  }
}

function ensureActorCanMutateExpense(expense, actorUserId, action) {
  if (expense.paid_by_user_id !== actorUserId) {
    throw new Error(`Only the expense payer can ${action} this expense`);
  }
}

module.exports = {
  ensureActorCanMutateExpense,
  validateExpenseSetId,
  validateSplitParticipants,
};
```

Create `lib/expenseSetAccess.d.ts` with matching TypeScript declarations.

- [ ] **Step 2: Run tests and verify GREEN**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add package.json lib/expenseSetAccess.js lib/expenseSetAccess.d.ts tests/expenseSetAccess.test.cjs
git commit -m "Add Expense Set access validation tests"
```

Expected: commit containing test runner and pure access helpers.

## Task 3: Add Expense Set API Routes

**Files:**
- Create: `app/api/expense-sets/route.ts`
- Create: `app/api/expense-sets/[id]/members/route.ts`

- [ ] **Step 1: Implement list/create route**

Create `app/api/expense-sets/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServiceRoleClient();
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, description, created_by, created_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const expenseSets = (data || [])
    .map((row: any) => row.groups)
    .filter(Boolean);

  return NextResponse.json(expenseSets);
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const { name, description, createdByUserId, memberIds = [] } = body;

  if (!name || !createdByUserId) {
    return NextResponse.json({ error: 'Name and createdByUserId are required' }, { status: 400 });
  }

  const uniqueMemberIds = [...new Set([createdByUserId, ...memberIds].filter(Boolean))];
  const { data: existingUsers, error: usersError } = await supabase
    .from('users')
    .select('id')
    .in('id', uniqueMemberIds);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if ((existingUsers || []).length !== uniqueMemberIds.length) {
    return NextResponse.json({ error: 'All Expense Set members must be registered users' }, { status: 400 });
  }

  const { data: expenseSet, error: setError } = await supabase
    .from('groups')
    .insert({ name, description: description || null, created_by: createdByUserId })
    .select()
    .single();

  if (setError) {
    return NextResponse.json({ error: setError.message }, { status: 500 });
  }

  const { error: membersError } = await supabase
    .from('group_members')
    .insert(uniqueMemberIds.map((userId) => ({ group_id: expenseSet.id, user_id: userId })));

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  return NextResponse.json(expenseSet, { status: 201 });
}
```

- [ ] **Step 2: Implement members route**

Create `app/api/expense-sets/[id]/members/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

async function isExpenseSetMember(supabase: ReturnType<typeof createServiceRoleClient>, setId: string, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', setId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceRoleClient();
  const actorUserId = request.nextUrl.searchParams.get('userId');

  if (!actorUserId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  if (!(await isExpenseSetMember(supabase, params.id, actorUserId))) {
    return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('id, group_id, user_id, joined_at, user:users(id, email, name, venmo_handle)')
    .eq('group_id', params.id)
    .order('joined_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const { actorUserId, userId } = body;

  if (!actorUserId || !userId) {
    return NextResponse.json({ error: 'actorUserId and userId are required' }, { status: 400 });
  }

  if (!(await isExpenseSetMember(supabase, params.id, actorUserId))) {
    return NextResponse.json({ error: 'Only Expense Set members can add members' }, { status: 403 });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'User must be registered before they can be added' }, { status: 400 });
  }

  const { error } = await supabase
    .from('group_members')
    .upsert({ group_id: params.id, user_id: userId }, { onConflict: 'group_id,user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Build route types**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add app/api/expense-sets
git commit -m "Add Expense Set API routes"
```

Expected: commit containing new API routes.

## Task 4: Scope Expense API Writes And Reads

**Files:**
- Modify: `app/api/expenses/route.ts`
- Modify: `app/api/expenses/[id]/route.ts`
- Import: `lib/expenseSetAccess.js`

- [ ] **Step 1: Update expense create/list route**

In `app/api/expenses/route.ts`, replace direct create/list logic with required `group_id`, membership lookup, split validation, and one route that creates expenses and splits together.

Important helper logic:

```ts
const memberIds = await loadExpenseSetMemberIds(supabase, group_id);
if (!memberIds.includes(paid_by_user_id)) {
  return NextResponse.json({ error: 'Only Expense Set members can add expenses' }, { status: 403 });
}
validateSplitParticipants(splits, memberIds);
```

- [ ] **Step 2: Update expense edit/delete route**

In `app/api/expenses/[id]/route.ts`, select `group_id`, validate actor membership in that set, reuse `ensureActorCanMutateExpense`, and reject split users outside the set before replacing split rows.

Important helper logic:

```ts
ensureActorCanMutateExpense(existingExpense, paidByUserId, 'edit');
validateSplitParticipants(splits, memberIds);
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add app/api/expenses/route.ts app/api/expenses/[id]/route.ts lib/expenseSetAccess.js lib/expenseSetAccess.d.ts
git commit -m "Require Expense Set membership for expense APIs"
```

Expected: commit containing scoped expense API behavior.

## Task 5: Update Dashboard And Modals

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/AddExpenseModal.tsx`
- Create: `components/CreateExpenseSetModal.tsx`
- Create: `components/ManageExpenseSetMembersModal.tsx`
- Modify: `components/SettlementSummary.tsx`
- Modify: `components/ExpenseList.tsx`
- Modify: `lib/types.ts`

- [ ] **Step 1: Add UI-facing types**

In `lib/types.ts`, add:

```ts
export interface ExpenseSet extends Group {}

export interface ExpenseSetMember extends GroupMember {
  user?: User;
}
```

- [ ] **Step 2: Create Expense Set modal**

Create `components/CreateExpenseSetModal.tsx` with props `isOpen`, `onClose`, `onCreated`, and `currentUserId`. It loads registered users from `users`, captures `name`, optional `description`, optional selected members, and posts to `/api/expense-sets`.

- [ ] **Step 3: Create member management modal**

Create `components/ManageExpenseSetMembersModal.tsx` with props `isOpen`, `onClose`, `onMembersChanged`, `expenseSet`, `members`, and `currentUserId`. It loads registered users, hides current members from the add dropdown, and posts to `/api/expense-sets/${expenseSet.id}/members`.

- [ ] **Step 4: Update AddExpenseModal**

Change `AddExpenseModal` props to require:

```ts
expenseSetId: string;
members: ExpenseSetMember[];
```

Use `members` as the selectable participants, remove global user loading for split selection, and create expenses through:

```ts
await fetch('/api/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description,
    amount: amountNum,
    paid_by_user_id: currentUserId,
    group_id: expenseSetId,
    splits,
  }),
});
```

- [ ] **Step 5: Update dashboard state**

In `app/dashboard/page.tsx`, add state for `expenseSets`, `selectedExpenseSetId`, `members`, `showCreateSetModal`, and `showMembersModal`. Load sets from `/api/expense-sets?userId=${user.id}`, load members from `/api/expense-sets/${selectedExpenseSetId}/members?userId=${user.id}`, and load expenses from `/api/expenses?userId=${user.id}&groupId=${selectedExpenseSetId}`.

- [ ] **Step 6: Build UI states**

Render:

```tsx
{expenseSets.length === 0 ? (
  <button onClick={() => setShowCreateSetModal(true)}>Create Expense Set</button>
) : (
  <select value={selectedExpenseSetId} onChange={(event) => setSelectedExpenseSetId(event.target.value)}>
    {expenseSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
  </select>
)}
```

Only show **Add Expense** when an Expense Set is selected.

- [ ] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add app/dashboard/page.tsx components/AddExpenseModal.tsx components/CreateExpenseSetModal.tsx components/ManageExpenseSetMembersModal.tsx components/ExpenseList.tsx components/SettlementSummary.tsx lib/types.ts
git commit -m "Add Expense Set dashboard workflow"
```

Expected: commit containing dashboard and component wiring.

## Task 6: Update Setup Documentation

**Files:**
- Modify: `SETUP.md`
- Optionally modify: `README.md`, `FEATURES.md`

- [ ] **Step 1: Update schema docs**

Change the setup SQL so `groups` is created before `expenses`, `expenses.group_id` is `UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE`, and indexes include `idx_expenses_group` and `idx_group_members_user`.

- [ ] **Step 2: Add RLS helper functions and policies**

Document membership helper functions such as:

```sql
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
```

Document policies that use the helper for `groups`, `group_members`, `expenses`, and `expense_splits`.

- [ ] **Step 3: Run documentation diff check**

Run:

```bash
git diff --check
```

Expected: no whitespace errors.

- [ ] **Step 4: Commit**

Run:

```bash
git add SETUP.md README.md FEATURES.md
git commit -m "Document Expense Set setup"
```

Expected: commit containing docs updates.

## Task 7: Final Verification

**Files:**
- Entire repo.

- [ ] **Step 1: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Check status**

Run:

```bash
git status --short --branch
```

Expected: clean tree or only intentional uncommitted files that must be reported.

## Self-Review

- Spec coverage: The plan covers mandatory Expense Sets, existing registered members only, any member adding members, member-scoped split selection, payer-only edit/delete, server-side validation, dashboard scoped expense loading, setup schema, and RLS docs.
- Placeholder scan: No `TBD`, `TODO`, or unspecified "add validation" steps remain; security-sensitive validation has concrete functions and error strings.
- Type consistency: UI naming uses `ExpenseSet` / `ExpenseSetMember`; physical schema keeps `groups`, `group_members`, and `expenses.group_id`.
