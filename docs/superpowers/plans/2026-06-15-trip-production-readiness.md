# Trip Production Readiness Review

Date: 2026-06-15
Audience: ShareExpenses owner running a private trip pilot with friends
Document type: How-to runbook plus production-readiness explanation

## Executive Summary

Phase 1 is functionally complete for a controlled trip pilot, not yet for broad public production.

The implemented phase now supports the core workflow needed for the upcoming trip:

- Create an Expense Set for the trip.
- Add existing registered users as members.
- Add expenses scoped to that Expense Set.
- Split expenses evenly, by exact custom amounts, or by shares/ratios.
- Pick a trip category on each expense: VRBO/Airbnb, Food, Groceries, Fuel, or Miscellaneous.
- Capture expense date and optional notes for each ledger entry.
- Calculate settlements only inside the selected Expense Set.
- Track settlement payment status as pending, paid, or confirmed.
- Let friends join an Expense Set from a shared join link after login or signup.
- Restrict expense visibility and write access by Expense Set membership in API validation and documented Supabase RLS.
- Let only the payer edit or delete their own expense.

For the trip in a few weeks, treat this as a private beta. Friends still need registered accounts, but they can now use a join link instead of being manually added after signup. Invite-by-email, guest users, member removal, offline support, receipt upload, and production Venmo OAuth are still outside the current implementation.

## Phase 1 Plan Check

Source plan: `docs/superpowers/specs/2026-06-15-expense-sets-design.md` and `docs/superpowers/plans/2026-06-15-expense-sets-implementation.md`.

### Completed

- Expense Sets are the required container for shared expenses.
- The physical database names remain `groups`, `group_members`, and `expenses.group_id`.
- Dashboard loads Expense Sets, selected-set members, selected-set expenses, and selected-set settlements.
- Expense creation uses `/api/expenses` and includes `group_id`.
- Expense create/update/delete routes validate membership and payer-only mutation rules.
- Split participants are checked against current Expense Set members.
- Create Expense Set and Manage Members modals exist.
- Setup SQL documents required Expense Set schema, RLS helper functions, RLS policies, and indexes.
- Tests cover Expense Set id validation, split participant validation, split totals, payer-only mutation, settlement balance adjustment, payment method availability, and trip expense category validation.

### Added For The Trip

- A shared category catalog in `lib/expenseCategories.js`.
- API validation that defaults missing categories to `miscellaneous` and rejects unsupported values.
- Category persistence on expense create and edit.
- Category dropdown in the add/edit expense modal.
- Category badges in the expense list.
- Setup SQL and existing-project upgrade SQL for `expenses.category`.

### Not Yet Production-Ready

- Friend onboarding uses shared join links, but there is no email invite workflow or guest-user mode.
- No member removal, roles, ownership transfer, or set archival.
- No receipt image upload or OCR itemization.
- No offline/PWA mode for weak signal during travel.
- No CSV/PDF export for the final trip ledger.
- Venmo integration is still a template and needs OAuth, token storage, and payment-state verification before being trusted for production.
- No activity feed, edit history, comments, or notifications.
- No production observability, error tracking, backup strategy, or migration framework.

## Tomorrow Runbook

1. Pull the latest local work and check status:

```bash
git status --short --branch
```

2. Install dependencies if needed:

```bash
npm install
```

3. Confirm `.env.local` has:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. If using a fresh Supabase project, run the complete schema from `SETUP.md`.

5. If using an existing Phase 1 database, run this upgrade SQL first:

```sql
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'miscellaneous';

ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
ADD CONSTRAINT expenses_category_check
CHECK (category IN ('lodging', 'food', 'groceries', 'fuel', 'miscellaneous'));

CREATE INDEX IF NOT EXISTS idx_expenses_group_category ON expenses(group_id, category);
```

6. Run local gates:

```bash
npm test
npm run build
```

7. Start the app:

```bash
npm run dev
```

8. Open `http://localhost:3200`.

9. Create or confirm every friend account. Each friend must sign up before they can be added.

10. Create one Expense Set for the trip, for example `Summer Trip`.

11. Add trip members from the registered user list.

12. Add a smoke-test expense:

- Description: `Dinner smoke test`
- Amount: `100`
- Category: `Food`
- Split type: `Even Split`
- Participants: two members
- Expected settlement: one participant owes the payer `50`

13. Add lodging with ratios:

- Category: `VRBO / Airbnb`
- Split type: `Shares Split`
- Use share numbers to represent ratios. Example: if one person pays half of what everyone else pays in a six-person group, use `2,2,2,2,2,1`.

14. Add representative trip expenses:

- `Food` for restaurants, takeout, snacks, and shared meals.
- `Groceries` for grocery runs and shared supplies.
- `Fuel` for gas, EV charging, tolls, parking, and driving costs.
- `Miscellaneous` for activities, supplies, fees, and anything else.

15. Confirm settlement summary only reflects the selected Expense Set.

16. Have a second account log in and confirm it can see the Expense Set and cannot see unrelated data.

## Private Trip Pilot Acceptance Criteria

Use this as the go/no-go checklist before inviting the full friend group.

- `npm test` passes.
- `npm run build` passes.
- Fresh login and signup work against the target Supabase project.
- The trip Expense Set can be created.
- Every intended participant can be added manually or through the join link.
- Category dropdown appears on Add Expense.
- Expense date and notes can be saved and shown in the ledger.
- Food, grocery, fuel, lodging, and miscellaneous expenses can be created.
- A lodging expense can be split by shares/ratios.
- Editing an expense preserves category and split data.
- Non-payers cannot edit or delete another payer's expense.
- A non-member cannot load the Expense Set expenses.
- Settlement summary is understandable enough to send to friends.
- Pending settlements stay visible without reducing balances; paid or confirmed settlements reduce balances.

## Competitive Research

Research checked on 2026-06-15.

### Splitwise

Splitwise remains the feature benchmark. Its Google Play listing highlights multi-platform support, debt simplification, expense categorization, group totals, CSV export, comments, equal and unequal splits by percentages/shares/exact amounts, recurring bills, multiple payers, balances across groups, activity feed, edit history, restore for deleted groups/bills, integrated payment handoff, and 100+ currencies. Splitwise Pro adds currency conversion, category spending charts, receipt OCR/itemization, receipt storage, JSON backups, search, and default splits. Source: https://play.google.com/store/apps/details?id=com.Splitwise.SplitwiseMobile

### SplitEasy

SplitEasy is positioned around fast entry for trips, flatmates, meals, and small groups. Its App Store listing calls out payer, participant, category, note, date, and currency capture; receipt and voice input; smart settlement; shareable settlement images; CSV records; optional iCloud sync; member grouping; regional default currencies; and advanced stats. Source: https://apps.apple.com/pl/app/spliteasy-split-expenses/id6749556847

### Tricount

Tricount emphasizes simple trip/group tracking: invite friends, add expenses, and keep balances clear. Its site claims broad adoption and positions itself for travelers, couples, and roommates. Tricount also has an offline feature page describing expense entry and review without internet, syncing later. Sources: https://tricount.com/en-us/ and https://tricount.com/en-us/expense-tracker-features/offline-expense-tracking

### Settle Up

Settle Up's site focuses on backed-up shared expenses, group visibility, and minimizing transactions. Its App Store listing adds offline support with sync, browser group links without requiring every friend to install the app, real-time exchange rates, QR/link invites, CSV export, notifications, reminders, receipt photos, recurring/future expenses, and custom categories. Sources: https://settleup.io/ and https://apps.apple.com/us/app/settle-up-group-expenses/id737534985

### SplitMyExpenses

SplitMyExpenses is a modern web competitor. Its site highlights group links, existing payment app handoff, CSV imports, bank/card linking for automatic imports, 150+ currencies, no expense limits, keyboard-friendly entry, multiple split types, AI receipt itemization, category spending charts, debt visualization, filters, minimized payments, AI summaries, AI category prediction, default splits, and daily card/bank imports. Source: https://www.splitmyexpenses.com/

### Splid, Splittr, Tab, And Cino

Splid and Splittr show that no-registration, offline support, multi-currency, simple exports, and minimized payments are strong trip use cases. Splittr specifically advertises custom categories, PDF/CSV export, stats, unequal split handling, and backups. Tab shows the restaurant-specific opportunity: receipt photo itemization, item claiming, proportional tax/tip, shared items, and birthday-style exclusions. Cino points to a different competitive axis: reducing manual reconciliation by splitting payments at the point of purchase through a shared virtual card. Sources: https://apps.apple.com/cy/app/splid-split-group-bills/id991473495, https://www.splittr.io/, https://www.tabapp.co/, and https://www.getcino.com/post/split-trip-expenses

## Competitive Build Recommendations

### Before The Upcoming Trip

Build these if time allows before the trip because they reduce real pilot friction:

1. CSV export for the final trip ledger.
2. Receipt image attachment without OCR.
3. Settlement share summary that can be copied to text or chat.
4. Member removal with historical expense preservation.
5. Basic activity history for edits, deletes, joins, and settlement changes.

### To Beat Splitwise And SplitEasy For Trips

The product should compete on "less accounting during the trip" rather than only matching generic split features.

Recommended differentiators:

- Trip-first setup templates: lodging deposit, grocery run, restaurant meal, fuel stop, activity tickets.
- Default split profiles per Expense Set: equal, family/couple shares, room-size shares, late-arrival shares.
- Category totals and "who benefited" views that make lodging and groceries less disputable.
- Receipt capture and lightweight itemization for restaurants and grocery runs.
- Offline-first PWA entry with later sync.
- Friend join links with no heavy onboarding.
- Final trip closeout package: balances, category totals, receipts, and payment instructions in one shareable view.
- Audit trail for edits and deletes.
- Payment handoff by preferred app, not only Venmo.
- Smart duplicate detection for common trip cases such as two people entering the same dinner.

### Later Production Features

- Proper migration files instead of setup-only SQL.
- Production auth hardening and environment separation.
- Error tracking, request logging, and database backup/restore drills.
- Rate limiting on API routes using the service-role client.
- Multi-currency support and per-expense exchange rates.
- Notifications and reminders.
- Mobile installability and offline caching.
- Accessibility pass with keyboard-only and screen-reader checks.

## Current Evidence

Fresh verification on 2026-06-15:

- `npm test`: 17 tests passed.
- `npm run lint`: no ESLint warnings or errors.
- `npm run build`: Next.js production build completed successfully.

One warning remains from npm: `Unknown user config "always-auth"`. It does not block tests or build, but it should be cleaned from local/npm config before wider production work.
