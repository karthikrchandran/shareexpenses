const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('home page keeps launch signup focused to nav and primary hero CTA', () => {
  const source = read('app/page.tsx');

  assert.equal(
    source.includes('Ready to split smarter?'),
    false,
    'bottom signup frame should be removed from the launch page'
  );
  const heroSignup = source.match(/<Link[\s\S]*?href="\/signup"[\s\S]*?Get Started Free[\s\S]*?<\/Link>/);
  assert.ok(heroSignup, 'primary hero signup CTA should exist');
  assert.match(
    heroSignup[0],
    /className="[^"]*border-2[^"]*shadow/,
    'primary signup CTA should have a stronger visible border and shadow'
  );
});

test('home navigation presents login and signup as separate visible buttons', () => {
  const source = read('app/page.tsx');
  const navLogin = source.match(/<Link[\s\S]*?href="\/login"[\s\S]*?Login[\s\S]*?<\/Link>/);
  const navSignup = source.match(/<Link[\s\S]*?href="\/signup"[\s\S]*?Sign Up[\s\S]*?<\/Link>/);

  assert.ok(navLogin, 'top login link should exist');
  assert.ok(navSignup, 'top signup link should exist');
  assert.match(navLogin[0], /className="[^"]*border-2[^"]*bg-secondary[^"]*px-5/);
  assert.match(navLogin[0], /className="[^"]*text-white[^"]*shadow/);
  assert.match(navSignup[0], /className="[^"]*bg-white[^"]*px-6/);
  assert.ok(source.indexOf('href="/login"') < source.indexOf('href="/signup"'));
});

test('dashboard shows Expense Sets as visible options instead of a dropdown', () => {
  const source = read('app/dashboard/page.tsx');

  assert.equal(
    source.includes('<select'),
    false,
    'Expense Set selector should not hide available sets in a dropdown'
  );
  assert.match(
    source,
    /renderExpenseSetButton/,
    'Expense Sets should render as visible selectable buttons'
  );
});

test('dashboard separates active and closed Expense Sets with compact icon cards', () => {
  const source = read('app/dashboard/page.tsx');

  assert.match(source, /const activeExpenseSets = useMemo/);
  assert.match(source, /const closedExpenseSets = useMemo/);
  assert.equal(source.includes('Active Expense Sets'), false);
  assert.equal(source.includes('Closed Expense Sets'), false);
  assert.match(source, />Open</);
  assert.match(source, />Archive</);
  assert.match(source, /getExpenseSetIcon/);
  assert.equal(
    source.includes('Shared expenses, members, balances, and closeout in one place.'),
    false,
    'Expense Set cards should not repeat the same fallback description'
  );
});

test('dashboard switches active and closed sets with search and paging', () => {
  const source = read('app/dashboard/page.tsx');

  assert.match(source, /type ExpenseSetView = 'active' \| 'closed'/);
  assert.match(source, /const EXPENSE_SET_PAGE_SIZE = 3/);
  assert.match(source, /expenseSetSearch/);
  assert.match(source, /setExpenseSetView\('active'\)/);
  assert.match(source, /setExpenseSetView\('closed'\)/);
  assert.match(source, /placeholder="Search Expense Sets"/);
  assert.match(source, /visibleExpenseSets/);
  assert.match(source, /Previous/);
  assert.match(source, /Next/);
  assert.equal(
    (source.match(/>Archive</g) || []).length,
    1,
    'Closed sets should be one compact switch option, not a separate repeated section'
  );
});

test('dashboard uses tabs for support panels instead of stacking right pane content', () => {
  const source = read('app/dashboard/page.tsx');
  const settlementOccurrences = source.match(/<SettlementSummary/g) || [];
  const closeoutOccurrences = source.match(/<TripCloseoutPanel/g) || [];
  const activityOccurrences = source.match(/<ActivityFeed/g) || [];
  const settlementSource = read('components/SettlementSummary.tsx');

  assert.match(source, /type WorkspaceTab = 'settlements' \| 'closeout' \| 'activity'/);
  assert.match(source, /supportTabs\.map/);
  assert.equal(settlementOccurrences.length, 1);
  assert.equal(closeoutOccurrences.length, 1);
  assert.equal(activityOccurrences.length, 1);
  assert.equal(
    settlementSource.includes('How it works'),
    false,
    'How-it-works instructions should not occupy the settlement panel'
  );
});

test('dashboard lays out active sets, expenses, and tools as three panes', () => {
  const source = read('app/dashboard/page.tsx');

  assert.match(source, /grid-cols-\[280px_minmax\(0,1fr\)_360px\]/);
  assert.match(source, /<aside[\s\S]*>Open</);
  assert.match(source, /aria-label="Expense Sets"/);
  assert.equal(
    source.includes('bg-gradient-to-br from-primary to-blue-600 p-3 text-white'),
    false,
    'Expense Set selector should not use the blue launch-page treatment inside the dashboard'
  );
  assert.match(source, /rounded-lg border border-indigo-100 bg-white\/95 p-4/);
  assert.match(source, /grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /role=\{isClosed \? undefined : 'tab'\}/);
  assert.match(source, /Selected Set/);
  assert.match(source, /Members[\s\S]*members\.length/);
  assert.match(source, /Closeout[\s\S]*selectedCloseout/);
  assert.match(source, /<main[\s\S]*Expense Ledger/);
  assert.match(source, /<aside[\s\S]*supportTabs\.map/);
  assert.match(source, /currentExpenseSetPage/);
});

test('add expense even split defaults to all members with select-all controls', () => {
  const source = read('components/AddExpenseModal.tsx');

  assert.match(source, /const allMemberIds = useMemo/);
  assert.match(source, /memberUsers\.map\(\(user\) => user\.id\)/);
  assert.match(source, /setSelectedUsers\(allMemberIds\.length > 0 \? allMemberIds : \[currentUserId\]\)/);
  assert.match(source, /Select all/);
  assert.match(source, /Clear/);
  assert.match(source, /selectedUsers\.length === memberUsers\.length/);
});

test('app provides a browser favicon for a polished local launch', () => {
  const layout = read('app/layout.tsx');

  assert.match(layout, /icons:\s*\{\s*icon:\s*'\/favicon\.svg'/);
  assert.equal(fs.existsSync(path.join(root, 'public/favicon.svg')), true);
});
