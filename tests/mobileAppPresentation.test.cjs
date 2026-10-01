const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('mobile app page exists and wraps the mobile app in a responsive device frame', () => {
  const source = read('app/mobile/page.tsx');

  assert.match(source, /DeviceFrame/);
  assert.match(source, /MobileApp/);
  assert.match(source, /osTheme/);
  assert.match(source, /frameMode/);
});

test('mobile view is distinct from desktop without replicating 3-pane dense layout', () => {
  const mobileSource = read('components/mobile/MobileApp.tsx');
  const desktopSource = read('app/dashboard/page.tsx');

  // Desktop uses 3-pane dense grid
  assert.match(desktopSource, /grid-cols-\[280px_minmax\(0,1fr\)_360px\]/);

  // Mobile must NOT replicate the 3-pane layout
  assert.equal(
    mobileSource.includes('grid-cols-[280px_minmax(0,1fr)_360px]'),
    false,
    'Mobile app should not replicate the 3-pane desktop layout'
  );
  assert.equal(
    mobileSource.includes('EXPENSE_SET_PAGE_SIZE'),
    false,
    'Mobile app should not replicate desktop pagination tables'
  );
});

test('mobile app provides authentic iOS and Android status bar and tab bar navigation', () => {
  const statusBar = read('components/mobile/MobileStatusBar.tsx');
  const tabBar = read('components/mobile/MobileTabBar.tsx');

  // iOS status bar with Dynamic Island capsule
  assert.match(statusBar, /Dynamic Island/i);
  assert.match(statusBar, /9:41/);
  // Android status bar
  assert.match(statusBar, /10:00/);

  // Mobile Bottom Tab Bar has 4 primary mobile tabs and quick action
  assert.match(tabBar, /Activity/);
  assert.match(tabBar, /Trips/);
  assert.match(tabBar, /Settle/);
  assert.match(tabBar, /Insights/);
  assert.match(tabBar, /Home Indicator/i);
});

test('mobile app features a high-impact balance card with 1-tap actions', () => {
  const card = read('components/mobile/MobileBalanceCard.tsx');

  assert.match(card, /You are owed overall|You owe overall/);
  assert.match(card, /Owed to you/);
  assert.match(card, /You owe/);
  assert.match(card, /Add Expense/);
  assert.match(card, /Settle Up/);
});

test('mobile app provides touch-friendly bottom sheets for adding and settling', () => {
  const addModal = read('components/mobile/MobileAddExpenseModal.tsx');
  const settleModal = read('components/mobile/MobileSettleModal.tsx');

  // Add Expense has big currency display, categories, and fast split
  assert.match(addModal, /placeholder="0.00"/);
  assert.match(addModal, /Dining/);
  assert.match(addModal, /Split Equally/);

  // Settle modal has Venmo and Apple Pay/Google Pay options
  assert.match(settleModal, /Venmo/);
  assert.match(settleModal, /Apple Cash \/ Pay|Google Pay/);
  assert.match(settleModal, /Cash \/ Direct/);
  assert.match(settleModal, /Payment Recorded!/);
});

test('device frame supports iPhone, Pixel, and Fullscreen modes with iOS / Android switcher', () => {
  const frame = read('components/mobile/DeviceFrame.tsx');

  assert.match(frame, /iPhone/);
  assert.match(frame, /Pixel/);
  assert.match(frame, /Full/);
  assert.match(frame, /iOS/);
  assert.match(frame, /Android/);
});

test('navigation on home and dashboard links to the mobile experience', () => {
  const home = read('app/page.tsx');
  const dashboard = read('app/dashboard/page.tsx');

  assert.match(home, /href="\/mobile"/);
  assert.match(dashboard, /href="\/mobile"/);
});

test('mobile app connects to live webapp data through authentication and api endpoints', () => {
  const mobileSource = read('components/mobile/MobileApp.tsx');

  assert.match(mobileSource, /useAuth/);
  assert.match(mobileSource, /\/api\/expense-sets\?userId=/);
  assert.match(mobileSource, /\/api\/expenses\?userId=/);
  assert.match(mobileSource, /\/api\/settlements\?userId=/);
  assert.match(mobileSource, /calculateSettlements/);
});

test('group creation does not auto-assign dummy members and respects user privacy', () => {
  const mobileAppSource = read('components/mobile/MobileApp.tsx');
  const createModalSource = read('components/mobile/MobileCreateGroupModal.tsx');
  const webCreateModal = read('components/CreateExpenseSetModal.tsx');
  const webManageModal = read('components/ManageExpenseSetMembersModal.tsx');

  // Must not hardcode dummy mock users into new group members
  assert.equal(
    mobileAppSource.includes('members: [CURRENT_USER, MOCK_USERS[1], MOCK_USERS[2]]'),
    false,
    'New groups should not automatically assign dummy users'
  );

  // Group creation modal supports inviting by email
  assert.match(createModalSource, /memberEmails/);
  assert.match(createModalSource, /Add Members by Email/i);

  // Web modals do not query all users globally from database
  assert.equal(
    webCreateModal.includes(".from('users')"),
    false,
    'CreateExpenseSetModal must not query all users globally'
  );
  assert.equal(
    webManageModal.includes(".from('users')"),
    false,
    'ManageExpenseSetMembersModal must not query all users globally'
  );
});

test('mobile app provides private join link and email-based member invitation modal', () => {
  const addMemberModal = read('components/mobile/MobileAddMemberModal.tsx');
  const groupsView = read('components/mobile/MobileGroupsView.tsx');

  assert.match(addMemberModal, /Private Invite Link/);
  assert.match(addMemberModal, /Add by Registered Email/i);
  assert.match(addMemberModal, /\/api\/expense-sets\/.*\/members/);
  assert.match(groupsView, /onAddMember/);
});
