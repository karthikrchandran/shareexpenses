# Expense Sets Design

Date: 2026-06-15
Status: Approved for implementation planning

## Summary

ShareExpenses will add **Expense Sets** as the required container for shared expenses. An Expense Set represents a trip, event, month, household, or other shared context such as "Summer Trip to New York", "Barcelona Concert Trip", or "March Expenses".

Expense Sets are not only a dashboard filter. They are the security boundary for expense visibility. Users can only see Expense Sets where they are members, and they can only see expenses, splits, and settlements inside those sets.

## Decisions

- The product term is **Expense Set**.
- The first version supports only existing registered users. Invite-by-email is out of scope.
- Every expense must belong to exactly one Expense Set.
- Any Expense Set member can add expenses inside that set.
- Any Expense Set member can split an expense among any subset of current members.
- Any Expense Set member can add other registered users to that set.
- Only the payer can edit or delete their own expense.
- Member removal, roles, ownership transfer, pending invites, and separate set detail routes are out of scope for this pass.

## Data Model

The existing database shape already includes `groups`, `group_members`, and `expenses.group_id`. For this pass, keep the physical table names to minimize migration risk, while exposing the feature as Expense Sets in UI and TypeScript-facing naming.

Required schema behavior:

- `groups` stores Expense Set records.
- `group_members` stores Expense Set membership.
- `expenses.group_id` becomes required and points to the owning Expense Set.
- Expense splits remain attached to `expenses` through `expense_splits.expense_id`.

Required constraints and indexes:

- `expenses.group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE`
- `group_members UNIQUE(group_id, user_id)`
- Index `expenses(group_id)`
- Index `group_members(user_id)`
- Keep existing expense and split indexes.

## Access Control

Supabase Row Level Security must enforce membership. The frontend must not be the only protection layer.

RLS target behavior:

- A user can read an Expense Set only when `auth.uid()` appears in `group_members` for that set.
- A user can read an expense only when they are a member of the expense's `group_id`.
- A user can read expense splits only when they are a member of the parent expense's Expense Set.
- A user can create an expense only inside an Expense Set where they are a member.
- A user can create split rows only for an expense in an Expense Set where they are a member.
- A user can add a registered user to an Expense Set only when the acting user is already a member of that set.
- A user can update or delete an expense only when they are the payer for that expense.

Server-side API routes must also validate these rules because the service role client bypasses RLS.

## User Flow

The dashboard becomes Expense Set-first.

When the signed-in user has no Expense Sets, the dashboard shows an empty state with a **Create Expense Set** action. Creating an Expense Set requires a name and automatically adds the creator as a member. The creator can add existing registered users during or after creation.

When the user has Expense Sets, the dashboard shows a list or selector of the user's sets. Selecting one set loads only that set's expenses and settlement summary.

Adding an expense requires a selected Expense Set. The add/edit expense modal receives the selected set and its current members. The "Split Among" control only lists members of the selected set, not all users in the app.

Any current member can open a lightweight member management action and add existing registered users to the selected Expense Set.

## UI Scope

Keep the first version inside `/dashboard`.

Do not add separate routes such as `/expense-sets/[id]` yet. The dashboard should track the selected Expense Set in component state for now. A URL-backed selection can be added later if the app needs deep links.

Required dashboard states:

- Loading Expense Sets.
- No Expense Sets yet.
- Expense Set selected with expenses.
- Expense Set selected with no expenses.
- Expense Set member management.
- Expense creation/editing with member-scoped split selection.

## Implementation Shape

Add API routes for Expense Set and member operations so server-side validation can be centralized. The existing expense edit/delete routes must be extended to validate membership and preserve set scoping. New expense creation must move through an API route so `group_id` and split membership are checked together before any rows are written.

Update `app/dashboard/page.tsx` to:

- Load the signed-in user's Expense Sets.
- Store the selected Expense Set.
- Load expenses with `.eq('group_id', selectedExpenseSetId)`.
- Pass only selected-set expenses to `ExpenseList` and `SettlementSummary`.
- Pass selected-set members and the selected set id to `AddExpenseModal`.

Update `AddExpenseModal` to:

- Require an `expenseSetId`.
- Receive members from the parent.
- Stop loading all users for split selection.
- Persist `group_id` when creating an expense.
- Reject split participants outside the selected Expense Set.

Update documentation in `SETUP.md` and any relevant README section so local setup includes the stricter Expense Set schema and RLS behavior.

## Error Handling

The app should show clear user-facing messages for:

- Attempting to add an expense without a selected Expense Set.
- Attempting to split with a user who is no longer a member.
- Attempting to edit or delete an expense the user did not pay for.
- Attempting to view an Expense Set after membership has changed.
- Database or RLS rejection during create/update/delete.

## Testing And Verification

Use test-first implementation for extracted business logic and validation helpers. Focus tests on:

- Settlement calculations remain scoped to the selected Expense Set because only selected-set expenses are passed in.
- Expense creation validation rejects missing `group_id`.
- Expense creation validation rejects split participants outside the selected Expense Set.
- Expense update/delete validation rejects non-payers.
- Member addition validation requires the actor to already be a member.

Verification commands for the implementation pass:

```bash
npm run lint
npm run build
```

Manual smoke coverage should include:

- Create an Expense Set.
- Add registered users to it.
- Add an expense split among selected members.
- Confirm a non-member cannot see the set's expenses.
- Confirm settlements are calculated only inside the selected set.

## Out Of Scope

- Email invites or pending invitations.
- Role hierarchy such as owner/admin/member.
- Member removal.
- Expense Set archival.
- Separate Expense Set pages.
- Deep links to a selected Expense Set.
- Analytics by Expense Set.
