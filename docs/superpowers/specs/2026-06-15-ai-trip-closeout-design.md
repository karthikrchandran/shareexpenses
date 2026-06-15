# AI Trip Closeout Design

Date: 2026-06-15
Status: Approved for implementation

## Summary

ShareExpenses will add an **AI Trip Closeout** for each Expense Set. The closeout is a saved, member-only summary that turns the trip ledger into an easy final review: totals by category, payer totals, largest expenses, settlement instructions, useful insights, and a copy-ready group message.

Receipts are explicitly out of scope for this pass. The closeout uses only structured expense, split, category, member, and settlement data already in the app.

## User Experience

Inside the dashboard, a selected Expense Set shows a **Trip Closeout** panel. A member can click **Generate Closeout**. The app builds a deterministic financial summary and, when `OPENAI_API_KEY` is configured, asks OpenAI to polish the narrative and group message. If no key is configured or the model call fails, the deterministic summary is still saved and shown.

After generation, the panel shows:

- Total trip spend.
- Category totals for VRBO/Airbnb, Food, Groceries, Fuel, and Miscellaneous.
- Biggest expenses.
- Who paid the most.
- Outstanding settlement rows.
- Insight bullets.
- Review flags such as possible duplicates or unusual partial splits.
- A copy-ready group message.
- A member-only share link to the saved closeout page.

The share page is `/closeouts/{closeoutId}`. It requires login and checks membership through the API before returning data.

## Data Model

Add `expense_set_closeouts`:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE`
- `generated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `summary_json JSONB NOT NULL`
- `ai_model TEXT`
- `ai_generated BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

RLS should allow members of the related Expense Set to read closeouts and insert closeouts. API routes also validate membership because the service-role client bypasses RLS.

## API

Add `POST /api/expense-sets/{id}/closeout`:

- Body: `{ actorUserId }`
- Validates actor is an Expense Set member.
- Loads the Expense Set, members, expenses, splits, and settled payments.
- Builds the closeout summary.
- Optionally polishes narrative text with OpenAI Responses API when configured.
- Saves and returns the closeout row.

Add `GET /api/expense-sets/{id}/closeout?userId=...`:

- Returns the latest closeout for the Expense Set after membership validation.

Add `GET /api/closeouts/{id}?userId=...`:

- Returns a saved closeout by id after checking that the user is a member of the closeout's Expense Set.

## AI Behavior

The AI call must not invent financial numbers. It receives already computed facts and may only improve narrative copy:

- `narrative`
- `groupMessage`
- `insights`

If AI is unavailable, the deterministic version is the source of truth.

The first implementation uses the OpenAI Responses API through `fetch` so the app does not need a new SDK dependency. The default model can be overridden by `OPENAI_CLOSEOUT_MODEL`; otherwise it uses `gpt-5.5`.

## Error Handling

- No expenses: return a clear message that the Expense Set needs expenses before closeout.
- Non-member: return 404 for read paths and 403 for generation.
- AI failure: save deterministic summary with `ai_generated=false`.
- Database failure: return an API error and keep the UI on the current dashboard.

## Testing

Pure tests should cover:

- Category totals.
- Payer totals.
- Settlement rows.
- Biggest expenses.
- Duplicate flags.
- Partial-split flags.
- Copy-ready group message.
- AI fallback behavior when no API key exists.

App verification:

- `npm test`
- `npm run lint`
- `npm run build`
- Run the app and verify the Trip Closeout panel is visible in the dashboard.
