export interface MobileUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
  venmo?: string;
}

export interface MobileGroup {
  id: string;
  name: string;
  emoji: string;
  coverGradient: string;
  members: MobileUser[];
  totalSpend: number;
  userBalance: number; // positive = owed to user, negative = user owes
  category: string;
  join_token?: string;
}

export interface MobileExpense {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  category: 'food' | 'transport' | 'lodging' | 'groceries' | 'entertainment' | 'fuel';
  amount: number;
  paidBy: MobileUser;
  date: string;
  displayDate: string; // "Today", "Yesterday", "Jun 14"
  yourShare: number; // what you owe or what you lent
  userIsPayer: boolean;
  splits: {
    user: MobileUser;
    amount: number;
  }[];
  notes?: string;
}

export interface MobileSettlement {
  id: string;
  groupId: string;
  groupName: string;
  fromUser: MobileUser;
  toUser: MobileUser;
  amount: number;
  status: 'pending' | 'settled';
  suggestedMethod: 'venmo' | 'apple-pay' | 'cash';
}

export const CURRENT_USER: MobileUser = {
  id: 'usr_me',
  name: 'Alex Rivera (You)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  email: 'alex@example.com',
  venmo: '@alex-rivera',
};

export const MOCK_USERS: MobileUser[] = [
  CURRENT_USER,
  {
    id: 'usr_sarah',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    email: 'sarah.c@example.com',
    venmo: '@sarahchen92',
  },
  {
    id: 'usr_marcus',
    name: 'Marcus Miller',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'marcus.m@example.com',
    venmo: '@marcus-m',
  },
  {
    id: 'usr_elena',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    email: 'elena.r@example.com',
    venmo: '@elena-rostova',
  },
];

export const INITIAL_GROUPS: MobileGroup[] = [
  {
    id: 'grp_tahoe',
    name: 'Lake Tahoe Cabin',
    emoji: '🏔️',
    coverGradient: 'from-blue-600 to-emerald-600',
    members: MOCK_USERS,
    totalSpend: 1420.5,
    userBalance: 86.25, // Alex is owed $86.25
    category: 'Trip',
  },
  {
    id: 'grp_roommates',
    name: 'Apartment 4B',
    emoji: '🏠',
    coverGradient: 'from-purple-600 to-indigo-600',
    members: [CURRENT_USER, MOCK_USERS[1], MOCK_USERS[2]],
    totalSpend: 2850.0,
    userBalance: -45.0, // Alex owes $45.00
    category: 'Home',
  },
  {
    id: 'grp_dinner',
    name: 'Friday Dinners',
    emoji: '🍕',
    coverGradient: 'from-amber-500 to-rose-500',
    members: [CURRENT_USER, MOCK_USERS[1], MOCK_USERS[3]],
    totalSpend: 340.0,
    userBalance: 42.5, // Alex is owed $42.50
    category: 'Social',
  },
];

export const INITIAL_EXPENSES: MobileExpense[] = [
  {
    id: 'exp_1',
    groupId: 'grp_tahoe',
    groupName: 'Lake Tahoe Cabin',
    title: 'Whole Foods Grocery Haul',
    category: 'groceries',
    amount: 184.4,
    paidBy: CURRENT_USER,
    date: '2026-06-15',
    displayDate: 'Today',
    yourShare: 138.3, // You paid $184.40, 3 others owe you ~$46.10 each -> net +$138.30
    userIsPayer: true,
    splits: [
      { user: CURRENT_USER, amount: 46.1 },
      { user: MOCK_USERS[1], amount: 46.1 },
      { user: MOCK_USERS[2], amount: 46.1 },
      { user: MOCK_USERS[3], amount: 46.1 },
    ],
    notes: 'Breakfast supplies, snacks, and campfire s’mores',
  },
  {
    id: 'exp_2',
    groupId: 'grp_tahoe',
    groupName: 'Lake Tahoe Cabin',
    title: 'Lakeside Grill & Bar',
    category: 'food',
    amount: 126.0,
    paidBy: MOCK_USERS[1], // Sarah paid
    date: '2026-06-15',
    displayDate: 'Today',
    yourShare: -31.5, // You owe Sarah $31.50
    userIsPayer: false,
    splits: [
      { user: CURRENT_USER, amount: 31.5 },
      { user: MOCK_USERS[1], amount: 31.5 },
      { user: MOCK_USERS[2], amount: 31.5 },
      { user: MOCK_USERS[3], amount: 31.5 },
    ],
    notes: 'Group dinner on the patio',
  },
  {
    id: 'exp_3',
    groupId: 'grp_roommates',
    groupName: 'Apartment 4B',
    title: 'High-Speed Fiber Internet',
    category: 'entertainment',
    amount: 90.0,
    paidBy: MOCK_USERS[2], // Marcus paid
    date: '2026-06-14',
    displayDate: 'Yesterday',
    yourShare: -30.0, // You owe Marcus $30.00
    userIsPayer: false,
    splits: [
      { user: CURRENT_USER, amount: 30.0 },
      { user: MOCK_USERS[1], amount: 30.0 },
      { user: MOCK_USERS[2], amount: 30.0 },
    ],
    notes: 'Monthly Gigabit WiFi',
  },
  {
    id: 'exp_4',
    groupId: 'grp_tahoe',
    groupName: 'Lake Tahoe Cabin',
    title: 'Gas & Mountain Pass Toll',
    category: 'fuel',
    amount: 72.8,
    paidBy: CURRENT_USER,
    date: '2026-06-13',
    displayDate: 'Jun 13',
    yourShare: 54.6, // You paid, 3 owe you $18.20 each
    userIsPayer: true,
    splits: [
      { user: CURRENT_USER, amount: 18.2 },
      { user: MOCK_USERS[1], amount: 18.2 },
      { user: MOCK_USERS[2], amount: 18.2 },
      { user: MOCK_USERS[3], amount: 18.2 },
    ],
    notes: 'Full tank fill-up on Highway 50',
  },
  {
    id: 'exp_5',
    groupId: 'grp_dinner',
    groupName: 'Friday Dinners',
    title: 'Artisan Woodfire Pizza',
    category: 'food',
    amount: 85.0,
    paidBy: CURRENT_USER,
    date: '2026-06-11',
    displayDate: 'Jun 11',
    yourShare: 56.67,
    userIsPayer: true,
    splits: [
      { user: CURRENT_USER, amount: 28.33 },
      { user: MOCK_USERS[1], amount: 28.33 },
      { user: MOCK_USERS[3], amount: 28.34 },
    ],
    notes: 'Truffle mushroom pizza and craft sodas',
  },
];

export const INITIAL_SETTLEMENTS: MobileSettlement[] = [
  {
    id: 'set_1',
    groupId: 'grp_tahoe',
    groupName: 'Lake Tahoe Cabin',
    fromUser: MOCK_USERS[1], // Sarah owes Alex
    toUser: CURRENT_USER,
    amount: 68.4,
    status: 'pending',
    suggestedMethod: 'venmo',
  },
  {
    id: 'set_2',
    groupId: 'grp_tahoe',
    groupName: 'Lake Tahoe Cabin',
    fromUser: MOCK_USERS[3], // Elena owes Alex
    toUser: CURRENT_USER,
    amount: 49.35,
    status: 'pending',
    suggestedMethod: 'apple-pay',
  },
  {
    id: 'set_3',
    groupId: 'grp_roommates',
    groupName: 'Apartment 4B',
    fromUser: CURRENT_USER, // Alex owes Marcus
    toUser: MOCK_USERS[2],
    amount: 34.0,
    status: 'pending',
    suggestedMethod: 'venmo',
  },
];
