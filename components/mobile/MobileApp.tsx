'use client';

import React, { useState, useMemo } from 'react';
import MobileStatusBar from './MobileStatusBar';
import MobileTabBar, { MobileTab } from './MobileTabBar';
import MobileBalanceCard from './MobileBalanceCard';
import MobileGroupStories from './MobileGroupStories';
import MobileExpenseFeed from './MobileExpenseFeed';
import MobileGroupsView from './MobileGroupsView';
import MobileSettleView from './MobileSettleView';
import MobileAnalyticsView from './MobileAnalyticsView';
import MobileAddExpenseModal from './MobileAddExpenseModal';
import MobileSettleModal from './MobileSettleModal';
import MobileReceiptModal from './MobileReceiptModal';
import MobileCreateGroupModal from './MobileCreateGroupModal';
import {
  CURRENT_USER,
  INITIAL_EXPENSES,
  INITIAL_GROUPS,
  INITIAL_SETTLEMENTS,
  MobileExpense,
  MobileGroup,
  MobileSettlement,
  MOCK_USERS,
} from './mockData';
import { Bell, Search, Sparkles, User, SlidersHorizontal, Check } from 'lucide-react';

interface MobileAppProps {
  osTheme: 'ios' | 'android';
}

export default function MobileApp({ osTheme }: MobileAppProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MobileTab>('feed');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Data State
  const [groups, setGroups] = useState<MobileGroup[]>(INITIAL_GROUPS);
  const [expenses, setExpenses] = useState<MobileExpense[]>(INITIAL_EXPENSES);
  const [settlements, setSettlements] = useState<MobileSettlement[]>(INITIAL_SETTLEMENTS);
  const [dynamicIslandMessage, setDynamicIslandMessage] = useState<string | null>(null);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<MobileSettlement | null>(null);
  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState<MobileExpense | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Toast / Island trigger helper
  const triggerNotification = (msg: string) => {
    setDynamicIslandMessage(msg);
    setTimeout(() => {
      setDynamicIslandMessage(null);
    }, 2800);
  };

  // Filtered expenses based on selected group
  const filteredExpenses = useMemo(() => {
    if (!selectedGroupId) return expenses;
    return expenses.filter((e) => e.groupId === selectedGroupId);
  }, [expenses, selectedGroupId]);

  // Selected Group details
  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Calculate Net Balances dynamically
  const { netBalance, totalOwedToYou, totalYouOwe } = useMemo(() => {
    let owedToYou = 0;
    let youOwe = 0;

    const relevantSettlements = selectedGroupId
      ? settlements.filter((s) => s.groupId === selectedGroupId && s.status === 'pending')
      : settlements.filter((s) => s.status === 'pending');

    for (const s of relevantSettlements) {
      if (s.toUser.id === CURRENT_USER.id) {
        owedToYou += s.amount;
      } else if (s.fromUser.id === CURRENT_USER.id) {
        youOwe += s.amount;
      }
    }

    return {
      netBalance: owedToYou - youOwe,
      totalOwedToYou: owedToYou,
      totalYouOwe: youOwe,
    };
  }, [settlements, selectedGroupId]);

  // Handle Adding Expense
  const handleSaveExpense = (newExpData: {
    title: string;
    amount: number;
    category: 'food' | 'transport' | 'lodging' | 'groceries' | 'entertainment' | 'fuel';
    groupId: string;
    splitType: 'equal' | 'you_paid_all' | 'they_owe_all';
    notes?: string;
  }) => {
    const targetGroup = groups.find((g) => g.id === newExpData.groupId) || groups[0];
    const memberCount = targetGroup.members.length;
    const splitAmount = Number((newExpData.amount / memberCount).toFixed(2));

    let yourShare = 0;
    if (newExpData.splitType === 'equal') {
      yourShare = newExpData.amount - splitAmount; // others owe you
    } else if (newExpData.splitType === 'you_paid_all') {
      yourShare = newExpData.amount;
    } else {
      yourShare = newExpData.amount;
    }

    const createdExpense: MobileExpense = {
      id: `exp_${Date.now()}`,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      title: newExpData.title,
      category: newExpData.category,
      amount: newExpData.amount,
      paidBy: CURRENT_USER,
      date: new Date().toISOString().split('T')[0],
      displayDate: 'Today',
      yourShare,
      userIsPayer: true,
      splits: targetGroup.members.map((m) => ({
        user: m,
        amount: splitAmount,
      })),
      notes: newExpData.notes,
    };

    setExpenses([createdExpense, ...expenses]);

    // Update group total
    setGroups((prev) =>
      prev.map((g) =>
        g.id === targetGroup.id
          ? {
              ...g,
              totalSpend: g.totalSpend + newExpData.amount,
              userBalance: g.userBalance + yourShare,
            }
          : g
      )
    );

    // Add a corresponding pending settlement from one of the members
    const otherMember = targetGroup.members.find((m) => m.id !== CURRENT_USER.id) || MOCK_USERS[1];
    const newSettlement: MobileSettlement = {
      id: `set_${Date.now()}`,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      fromUser: otherMember,
      toUser: CURRENT_USER,
      amount: splitAmount,
      status: 'pending',
      suggestedMethod: 'venmo',
    };
    setSettlements((prev) => [newSettlement, ...prev]);

    triggerNotification(`Added: ${newExpData.title} ($${newExpData.amount})`);
  };

  // Handle Confirming a Settlement
  const handleConfirmSettlement = (settlementId: string, paymentMethod: string) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === settlementId ? { ...s, status: 'settled' as const } : s))
    );

    const s = settlements.find((item) => item.id === settlementId);
    if (s) {
      triggerNotification(`Settled $${s.amount.toFixed(2)} with ${s.fromUser.name.split(' ')[0]}`);
    }
  };

  // Handle Deleting Expense
  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    triggerNotification('Expense deleted');
  };

  // Handle Creating Group
  const handleCreateGroup = (groupData: { name: string; emoji: string; category: string }) => {
    const newGrp: MobileGroup = {
      id: `grp_${Date.now()}`,
      name: groupData.name,
      emoji: groupData.emoji,
      coverGradient: 'from-emerald-500 to-teal-600',
      members: [CURRENT_USER, MOCK_USERS[1], MOCK_USERS[2]],
      totalSpend: 0,
      userBalance: 0,
      category: groupData.category,
    };

    setGroups([...groups, newGrp]);
    setSelectedGroupId(newGrp.id);
    setActiveTab('feed');
    triggerNotification(`Circle created: ${groupData.name}`);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-slate-50 relative overflow-hidden font-sans">
      {/* 1. Status Bar */}
      <MobileStatusBar osTheme={osTheme} dynamicIslandMessage={dynamicIslandMessage} />

      {/* 2. Top App Header */}
      <header
        className={`px-4 py-2.5 flex items-center justify-between z-10 ${
          osTheme === 'ios'
            ? 'bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50'
            : 'bg-white border-b border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <img
            src={CURRENT_USER.avatar}
            alt={CURRENT_USER.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-600/30"
          />
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {osTheme === 'ios' ? 'Personal Wallet' : 'ShareExpenses'}
            </div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {CURRENT_USER.name.split(' ')[0]} Rivera
            </div>
          </div>
        </div>

        {/* Header Right Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-600 transition"
            title="Search or filter"
          >
            <Search size={17} />
          </button>
          <button
            onClick={() => triggerNotification('All balances are synced')}
            className="relative p-1.5 rounded-full hover:bg-slate-200/60 text-slate-600 transition"
            title="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600"></span>
          </button>
        </div>
      </header>

      {/* 3. Main Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* TAB 1: FEED / HOME */}
        {activeTab === 'feed' && (
          <div className="space-y-3 pt-3">
            {/* Balance Card */}
            <div className="px-4">
              <MobileBalanceCard
                netBalance={netBalance}
                totalOwedToYou={totalOwedToYou}
                totalYouOwe={totalYouOwe}
                selectedGroupName={selectedGroup?.name}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenSettle={() => {
                  const firstPending = settlements.find((s) => s.status === 'pending');
                  if (firstPending) {
                    setSelectedSettlement(firstPending);
                    setIsSettleOpen(true);
                  } else {
                    setActiveTab('settle');
                  }
                }}
                osTheme={osTheme}
              />
            </div>

            {/* Horizontal Trip Stories / Filter Bar */}
            <MobileGroupStories
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={(id) => setSelectedGroupId(id)}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
              osTheme={osTheme}
            />

            {/* Daily Expense Feed */}
            <MobileExpenseFeed
              expenses={filteredExpenses}
              onSelectExpense={(exp) => setSelectedReceiptExpense(exp)}
              osTheme={osTheme}
            />
          </div>
        )}

        {/* TAB 2: GROUPS / TRIPS */}
        {activeTab === 'groups' && (
          <MobileGroupsView
            groups={groups}
            onSelectGroup={(grpId) => {
              setSelectedGroupId(grpId);
              setActiveTab('feed');
            }}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onShareGroup={(grp) => {
              triggerNotification(`Invite link copied for ${grp.name}!`);
            }}
            osTheme={osTheme}
          />
        )}

        {/* TAB 3: SETTLE / BALANCES */}
        {activeTab === 'settle' && (
          <MobileSettleView
            settlements={settlements}
            currentUserId={CURRENT_USER.id}
            onSettleClick={(settlement) => {
              setSelectedSettlement(settlement);
              setIsSettleOpen(true);
            }}
            osTheme={osTheme}
          />
        )}

        {/* TAB 4: ANALYTICS / REPORTS */}
        {activeTab === 'analytics' && (
          <MobileAnalyticsView expenses={filteredExpenses} osTheme={osTheme} />
        )}
      </div>

      {/* 4. Native Bottom Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddModal={() => setIsAddExpenseOpen(true)}
        osTheme={osTheme}
        pendingSettlementCount={settlements.filter((s) => s.status === 'pending').length}
      />

      {/* Modals & Bottom Sheets */}
      <MobileAddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groups={groups}
        selectedGroupId={selectedGroupId}
        currentUser={CURRENT_USER}
        onSaveExpense={handleSaveExpense}
        osTheme={osTheme}
      />

      <MobileSettleModal
        isOpen={isSettleOpen}
        onClose={() => {
          setIsSettleOpen(false);
          setSelectedSettlement(null);
        }}
        settlement={selectedSettlement}
        currentUser={CURRENT_USER}
        onConfirmSettlement={handleConfirmSettlement}
        osTheme={osTheme}
      />

      <MobileReceiptModal
        isOpen={selectedReceiptExpense !== null}
        onClose={() => setSelectedReceiptExpense(null)}
        expense={selectedReceiptExpense}
        onDeleteExpense={handleDeleteExpense}
        osTheme={osTheme}
      />

      <MobileCreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        osTheme={osTheme}
      />
    </div>
  );
}
