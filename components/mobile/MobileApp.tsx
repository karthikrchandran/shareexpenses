'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
import MobileAddMemberModal from './MobileAddMemberModal';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { calculateSettlements } from '@/lib/settlementCalculations';
import {
  CURRENT_USER,
  INITIAL_EXPENSES,
  INITIAL_GROUPS,
  INITIAL_SETTLEMENTS,
  MobileExpense,
  MobileGroup,
  MobileSettlement,
  MobileUser,
  MOCK_USERS,
} from './mockData';
import {
  Bell,
  Search,
  Sparkles,
  User,
  SlidersHorizontal,
  Check,
  LogIn,
  Loader2,
  Plus,
} from 'lucide-react';

interface MobileAppProps {
  osTheme: 'ios' | 'android';
}

const GRADIENTS = [
  'from-blue-600 to-emerald-600',
  'from-purple-600 to-indigo-600',
  'from-amber-500 to-rose-500',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-rose-500',
];

function getGroupEmojiAndCategory(name: string, description?: string) {
  const text = `${name} ${description || ''}`.toLowerCase();
  if (
    text.includes('trip') ||
    text.includes('cabin') ||
    text.includes('tahoe') ||
    text.includes('beach') ||
    text.includes('miami') ||
    text.includes('flight')
  ) {
    return { emoji: '🏖️', category: 'Trip' };
  }
  if (
    text.includes('home') ||
    text.includes('room') ||
    text.includes('rent') ||
    text.includes('house') ||
    text.includes('apt')
  ) {
    return { emoji: '🏠', category: 'Home' };
  }
  if (
    text.includes('dinner') ||
    text.includes('food') ||
    text.includes('pizza') ||
    text.includes('lunch')
  ) {
    return { emoji: '🍕', category: 'Social' };
  }
  if (text.includes('car') || text.includes('gas') || text.includes('road')) {
    return { emoji: '🚗', category: 'Trip' };
  }
  if (text.includes('party') || text.includes('event')) {
    return { emoji: '🎉', category: 'Event' };
  }
  return { emoji: '🏔️', category: 'Trip' };
}

export default function MobileApp({ osTheme }: MobileAppProps) {
  const { user, loading: authLoading } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<MobileTab>('feed');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Authenticated User Profile
  const [currentUser, setCurrentUser] = useState<MobileUser>(CURRENT_USER);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

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
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<MobileGroup | null>(null);

  // Toast / Island trigger helper
  const triggerNotification = (msg: string) => {
    setDynamicIslandMessage(msg);
    setTimeout(() => {
      setDynamicIslandMessage(null);
    }, 2800);
  };

  // Load Real WebApp Data
  const loadRealData = useCallback(async () => {
    if (!user?.id) return;
    setIsDataLoading(true);

    try {
      // 1. Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, venmo_handle')
        .eq('id', user.id)
        .maybeSingle();

      const activeUser: MobileUser = {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'You',
        avatar:
          profile?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`,
        email: profile?.email || user.email || '',
        venmo: profile?.venmo_handle || undefined,
      };
      setCurrentUser(activeUser);

      // 2. Fetch user's expense sets / groups
      const setsRes = await fetch(`/api/expense-sets?userId=${encodeURIComponent(user.id)}`);
      const expenseSets = await setsRes.json();
      if (!setsRes.ok || !Array.isArray(expenseSets)) {
        throw new Error('Failed to load expense sets');
      }

      if (expenseSets.length === 0) {
        setGroups([]);
        setExpenses([]);
        setSettlements([]);
        setSelectedGroupId(null);
        return;
      }

      const loadedGroups: MobileGroup[] = [];
      const allLoadedExpenses: MobileExpense[] = [];
      const allLoadedSettlements: MobileSettlement[] = [];

      for (let i = 0; i < expenseSets.length; i++) {
        const set = expenseSets[i];
        const [membersRes, expRes, setRes] = await Promise.all([
          fetch(`/api/expense-sets/${set.id}/members?userId=${encodeURIComponent(user.id)}`),
          fetch(`/api/expenses?userId=${encodeURIComponent(user.id)}&groupId=${encodeURIComponent(set.id)}`),
          fetch(`/api/settlements?userId=${encodeURIComponent(user.id)}&groupId=${encodeURIComponent(set.id)}`),
        ]);

        const rawMembers = membersRes.ok ? await membersRes.json() : [];
        const rawExpenses = expRes.ok ? await expRes.json() : [];
        const rawSettlements = setRes.ok ? await setRes.json() : [];

        // Map members to MobileUser[]
        const membersList: MobileUser[] = (Array.isArray(rawMembers) ? rawMembers : []).map(
          (m: any) => {
            const u = m.user || {};
            const isMe = u.id === user.id || m.user_id === user.id;
            return {
              id: u.id || m.user_id,
              name: isMe
                ? `${u.name || activeUser.name} (You)`
                : u.name || u.email?.split('@')[0] || 'Friend',
              email: u.email || '',
              avatar:
                u.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  u.name || u.id || m.user_id
                )}`,
              venmo: u.venmo_handle,
            };
          }
        );

        if (!membersList.some((m) => m.id === user.id)) {
          membersList.unshift(activeUser);
        }

        // Fetch splits for these expenses
        const expenseIds = (Array.isArray(rawExpenses) ? rawExpenses : []).map((e: any) => e.id);
        let splitsData: any[] = [];
        if (expenseIds.length > 0) {
          const { data: splits } = await supabase
            .from('expense_splits')
            .select('expense_id, user_id, amount')
            .in('expense_id', expenseIds);
          splitsData = splits || [];
        }

        // Calculate settlement matrix for this group
        const groupSettlementMatrix = calculateSettlements(
          rawExpenses,
          splitsData,
          rawSettlements
        );

        // Calculate user balance for this group
        let userGroupBalance = 0;
        Object.entries(groupSettlementMatrix).forEach(([debtorId, creditors]: [string, any]) => {
          Object.entries(creditors).forEach(([creditorId, amount]: [string, any]) => {
            const numAmount = Number(amount);
            if (creditorId === user.id) {
              userGroupBalance += numAmount; // owed to user
            } else if (debtorId === user.id) {
              userGroupBalance -= numAmount; // user owes
            }

            // Pending balance item for Settle view
            if (numAmount > 0.01) {
              const debtor =
                membersList.find((m) => m.id === debtorId) || {
                  id: debtorId,
                  name: debtorId === user.id ? `${activeUser.name} (You)` : 'Member',
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${debtorId}`,
                  email: '',
                };
              const creditor =
                membersList.find((m) => m.id === creditorId) || {
                  id: creditorId,
                  name: creditorId === user.id ? `${activeUser.name} (You)` : 'Member',
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creditorId}`,
                  email: '',
                };

              allLoadedSettlements.push({
                id: `set_${set.id}_${debtorId}_${creditorId}`,
                groupId: set.id,
                groupName: set.name,
                fromUser: debtor,
                toUser: creditor,
                amount: numAmount,
                status: 'pending',
                suggestedMethod: 'venmo',
              });
            }
          });
        });

        const { emoji, category } = getGroupEmojiAndCategory(set.name, set.description);
        const totalSpend = (Array.isArray(rawExpenses) ? rawExpenses : []).reduce(
          (sum: number, e: any) => sum + Number(e.amount || 0),
          0
        );

        loadedGroups.push({
          id: set.id,
          name: set.name,
          emoji,
          coverGradient: GRADIENTS[i % GRADIENTS.length],
          members: membersList,
          totalSpend,
          userBalance: Number(userGroupBalance.toFixed(2)),
          category,
          join_token: set.join_token,
        });

        // Map expenses to MobileExpense[]
        (Array.isArray(rawExpenses) ? rawExpenses : []).forEach((exp: any) => {
          const payerUser =
            membersList.find((m) => m.id === exp.paid_by_user_id) || {
              id: exp.paid_by_user_id,
              name:
                exp.paid_by_user?.name ||
                (exp.paid_by_user_id === user.id ? `${activeUser.name} (You)` : 'Member'),
              avatar:
                exp.paid_by_user?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.paid_by_user_id}`,
              email: exp.paid_by_user?.email || '',
              venmo: exp.paid_by_user?.venmo_handle,
            };

          const isPayer = exp.paid_by_user_id === user.id;
          const expSplits = splitsData.filter((s) => s.expense_id === exp.id);
          const userSplit = expSplits.find((s) => s.user_id === user.id);

          const yourShare = isPayer
            ? Number(exp.amount) - (userSplit ? Number(userSplit.amount) : 0)
            : userSplit
            ? Number(userSplit.amount)
            : Number(exp.amount) / Math.max(membersList.length, 1);

          // Map database category to mobile category
          let mobileCat: 'food' | 'transport' | 'lodging' | 'groceries' | 'entertainment' | 'fuel' =
            'food';
          if (exp.category === 'groceries') mobileCat = 'groceries';
          else if (exp.category === 'fuel') mobileCat = 'fuel';
          else if (exp.category === 'lodging') mobileCat = 'lodging';
          else if (exp.category === 'food') mobileCat = 'food';
          else mobileCat = 'entertainment';

          // Display date
          const dateStr = exp.expense_date || (exp.created_at ? exp.created_at.split('T')[0] : '');
          const todayStr = new Date().toISOString().split('T')[0];
          let displayDate = dateStr;
          if (dateStr === todayStr) {
            displayDate = 'Today';
          } else if (dateStr) {
            try {
              const d = new Date(dateStr + 'T00:00:00');
              displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch {
              displayDate = dateStr;
            }
          }

          allLoadedExpenses.push({
            id: exp.id,
            groupId: set.id,
            groupName: set.name,
            title: exp.description,
            category: mobileCat,
            amount: Number(exp.amount),
            paidBy: payerUser,
            date: dateStr,
            displayDate,
            yourShare: Number(yourShare.toFixed(2)),
            userIsPayer: isPayer,
            splits: expSplits.map((s) => ({
              user:
                membersList.find((m) => m.id === s.user_id) || {
                  id: s.user_id,
                  name: s.user_id === user.id ? `${activeUser.name} (You)` : 'Member',
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user_id}`,
                  email: '',
                },
              amount: Number(s.amount),
            })),
            notes: exp.notes || undefined,
          });
        });
      }

      setGroups(loadedGroups);
      setExpenses(allLoadedExpenses);
      setSettlements(allLoadedSettlements);
    } catch (err: any) {
      console.error('Error loading mobile real data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata?.name]);

  useEffect(() => {
    if (user?.id) {
      loadRealData();
    }
  }, [user?.id, loadRealData]);

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
      if (s.toUser.id === currentUser.id) {
        owedToYou += s.amount;
      } else if (s.fromUser.id === currentUser.id) {
        youOwe += s.amount;
      }
    }

    return {
      netBalance: owedToYou - youOwe,
      totalOwedToYou: owedToYou,
      totalYouOwe: youOwe,
    };
  }, [settlements, selectedGroupId, currentUser.id]);

  // Handle Adding Expense
  const handleSaveExpense = async (newExpData: {
    title: string;
    amount: number;
    category: 'food' | 'transport' | 'lodging' | 'groceries' | 'entertainment' | 'fuel';
    groupId: string;
    splitType: 'equal' | 'you_paid_all' | 'they_owe_all';
    notes?: string;
  }) => {
    const targetGroup = groups.find((g) => g.id === newExpData.groupId) || groups[0];
    if (!targetGroup) {
      triggerNotification('Please create or select a group first');
      return;
    }

    // In demo mode or if user is not logged in:
    if (!user?.id || isDemoMode) {
      const memberCount = Math.max(targetGroup.members.length, 1);
      const splitAmount = Number((newExpData.amount / memberCount).toFixed(2));
      const yourShare = newExpData.amount - splitAmount;

      const createdExpense: MobileExpense = {
        id: `exp_${Date.now()}`,
        groupId: targetGroup.id,
        groupName: targetGroup.name,
        title: newExpData.title,
        category: newExpData.category,
        amount: newExpData.amount,
        paidBy: currentUser,
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
      triggerNotification(`Added: ${newExpData.title} ($${newExpData.amount})`);
      return;
    }

    // Real API call:
    let dbCategory = 'miscellaneous';
    if (newExpData.category === 'food') dbCategory = 'food';
    else if (newExpData.category === 'groceries') dbCategory = 'groceries';
    else if (newExpData.category === 'fuel' || newExpData.category === 'transport') dbCategory = 'fuel';
    else if (newExpData.category === 'lodging') dbCategory = 'lodging';

    const memberIds = targetGroup.members.map((m) => m.id);
    const memberCount = Math.max(memberIds.length, 1);
    const splitAmount = Number((newExpData.amount / memberCount).toFixed(2));
    const allocated = Number((splitAmount * memberCount).toFixed(2));

    const splits = memberIds.map((memberId, index) => ({
      user_id: memberId,
      amount:
        index === 0
          ? Number((splitAmount + (newExpData.amount - allocated)).toFixed(2))
          : splitAmount,
      is_itemized: false,
    }));

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExpData.title,
          amount: newExpData.amount,
          paid_by_user_id: user.id,
          group_id: targetGroup.id,
          category: dbCategory,
          expense_date: new Date().toISOString().split('T')[0],
          notes: newExpData.notes || null,
          splits,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to add expense');
      }

      await loadRealData();
      triggerNotification(`Added: ${newExpData.title} ($${newExpData.amount})`);
    } catch (err: any) {
      triggerNotification(err.message || 'Error saving expense');
    }
  };

  // Handle Confirming a Settlement
  const handleConfirmSettlement = async (settlementId: string, paymentMethod: string) => {
    const s = settlements.find((item) => item.id === settlementId);
    if (!s) return;

    if (!user?.id || isDemoMode) {
      setSettlements((prev) =>
        prev.map((item) => (item.id === settlementId ? { ...item, status: 'settled' as const } : item))
      );
      triggerNotification(`Settled $${s.amount.toFixed(2)} with ${s.fromUser.name.split(' ')[0]}`);
      return;
    }

    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_user_id: user.id,
          group_id: s.groupId,
          from_user_id: s.fromUser.id,
          to_user_id: s.toUser.id,
          amount: s.amount,
          payment_method: paymentMethod === 'venmo' ? 'venmo' : 'outside-app',
          payment_status: 'paid',
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to record settlement');
      }

      await loadRealData();
      triggerNotification(`Settled $${s.amount.toFixed(2)} with ${s.fromUser.name.split(' ')[0]}`);
    } catch (err: any) {
      triggerNotification(err.message || 'Error recording settlement');
    }
  };

  // Handle Deleting Expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!user?.id || isDemoMode) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      triggerNotification('Expense deleted');
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidByUserId: user.id }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || 'Failed to delete expense');
      }

      await loadRealData();
      triggerNotification('Expense deleted');
    } catch (err: any) {
      triggerNotification(err.message || 'Error deleting expense');
    }
  };

  // Handle Creating Group
  const handleCreateGroup = async (groupData: {
    name: string;
    emoji: string;
    category: string;
    memberEmails?: string[];
  }) => {
    if (!user?.id || isDemoMode) {
      // In demo mode: create group with ONLY current user, respecting privacy!
      const newGrp: MobileGroup = {
        id: `grp_${Date.now()}`,
        name: groupData.name,
        emoji: groupData.emoji,
        coverGradient: GRADIENTS[groups.length % GRADIENTS.length],
        members: [currentUser],
        totalSpend: 0,
        userBalance: 0,
        category: groupData.category,
      };

      setGroups([...groups, newGrp]);
      setSelectedGroupId(newGrp.id);
      setActiveTab('feed');
      triggerNotification(`Circle created: ${groupData.name}`);
      return;
    }

    try {
      const res = await fetch('/api/expense-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupData.name,
          description: `${groupData.emoji} ${groupData.category}`,
          createdByUserId: user.id,
          memberEmails: groupData.memberEmails || [],
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create group');
      }

      await loadRealData();
      setSelectedGroupId(payload.id);
      setActiveTab('feed');
      triggerNotification(`Circle created: ${groupData.name}`);
    } catch (err: any) {
      triggerNotification(err.message || 'Error creating group');
    }
  };

  // Handle Sharing Group Link
  const handleShareGroup = async (grp: MobileGroup) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const joinUrl = grp.join_token ? `${origin}/join/${grp.join_token}` : '';
    if (joinUrl) {
      try {
        await navigator.clipboard.writeText(joinUrl);
        triggerNotification(`Invite link copied for ${grp.name}!`);
      } catch {
        triggerNotification(`Invite link ready for ${grp.name}`);
      }
    } else {
      triggerNotification(`Invite link for ${grp.name}`);
    }
  };

  // Unauthenticated Screen inside Device
  if (!authLoading && !user && !isDemoMode) {
    return (
      <div className="w-full h-full flex flex-col justify-between bg-slate-50 relative overflow-hidden font-sans select-none">
        <MobileStatusBar osTheme={osTheme} dynamicIslandMessage={dynamicIslandMessage} />

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/30 mb-4 animate-bounce">
            💸
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
            ShareExpenses Mobile
          </h2>
          <p className="text-xs text-slate-500 max-w-[240px] mb-6 leading-relaxed">
            Connect to your live account to view your actual groups, shared expenses, and settlements.
          </p>

          <div className="w-full max-w-[280px] space-y-2.5">
            <Link
              href="/login?next=/mobile"
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition"
            >
              <LogIn size={16} />
              <span>Log In to Your Account</span>
            </Link>

            <button
              onClick={() => setIsDemoMode(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Preview Sample View
            </button>
          </div>
        </div>

        <div className="p-4 text-center">
          <Link href="/dashboard" className="text-[11px] font-semibold text-indigo-600 hover:underline">
            ← Back to Web App
          </Link>
        </div>
      </div>
    );
  }

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
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-600/30"
          />
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {osTheme === 'ios' ? 'Personal Wallet' : 'ShareExpenses'}
            </div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser.name}
            </div>
          </div>
        </div>

        {/* Header Right Action icons */}
        <div className="flex items-center gap-1.5">
          {isDataLoading && (
            <Loader2 size={16} className="text-indigo-600 animate-spin mr-1" />
          )}
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-600 transition"
            title="Add expense"
          >
            <Plus size={17} />
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
            onShareGroup={handleShareGroup}
            onAddMember={(grp) => setSelectedGroupForMember(grp)}
            osTheme={osTheme}
          />
        )}

        {/* TAB 3: SETTLE / BALANCES */}
        {activeTab === 'settle' && (
          <MobileSettleView
            settlements={settlements}
            currentUserId={currentUser.id}
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
        currentUser={currentUser}
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
        currentUser={currentUser}
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

      <MobileAddMemberModal
        isOpen={selectedGroupForMember !== null}
        onClose={() => setSelectedGroupForMember(null)}
        group={selectedGroupForMember}
        currentUserId={currentUser.id}
        onMemberAdded={async () => {
          await loadRealData();
          triggerNotification(`Member added!`);
        }}
        onCopyJoinLink={() => triggerNotification(`Invite link copied!`)}
        osTheme={osTheme}
      />
    </div>
  );
}
