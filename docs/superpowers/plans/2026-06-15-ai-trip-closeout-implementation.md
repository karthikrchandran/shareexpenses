# AI Trip Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a no-receipts, saved AI Trip Closeout summary for each Expense Set.

**Architecture:** Use a pure closeout engine for financial facts and deterministic fallback copy. Add API routes that load Expense Set data, validate membership, optionally polish copy with OpenAI, and save the summary. Add a dashboard panel and member-only closeout page to display the saved result.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Supabase, Node test runner, OpenAI Responses API through `fetch`.

---

## File Structure

- Create `lib/tripCloseout.js`: pure closeout aggregation and deterministic insight/message generation.
- Create `lib/tripCloseout.d.ts`: TypeScript declarations.
- Create `lib/openaiCloseout.js`: optional OpenAI copy polish helper with deterministic fallback.
- Create `lib/openaiCloseout.d.ts`: TypeScript declarations.
- Create `tests/tripCloseout.test.cjs`: pure unit coverage.
- Create `app/api/expense-sets/[id]/closeout/route.ts`: latest closeout GET and generation POST.
- Create `app/api/closeouts/[id]/route.ts`: member-scoped saved closeout GET.
- Create `components/TripCloseoutPanel.tsx`: dashboard generate/view/share UI.
- Create `app/closeouts/[id]/page.tsx`: saved closeout page.
- Modify `app/dashboard/page.tsx`: render `TripCloseoutPanel`.
- Modify `SETUP.md`: add `expense_set_closeouts` schema, RLS, indexes, and upgrade SQL.

## Tasks

- [ ] Add failing tests for closeout aggregation and fallback AI behavior.
- [ ] Implement pure closeout engine and AI fallback helper.
- [ ] Add API routes and setup SQL.
- [ ] Add dashboard panel and closeout page UI.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Start the dev server and report the local URL.

## Self-Review

- Scope excludes receipts and OCR.
- AI is optional and cannot block the deterministic summary.
- Saved closeout access stays member-scoped.
- The feature can be demonstrated without `OPENAI_API_KEY`.
