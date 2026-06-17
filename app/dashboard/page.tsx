'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, logout } from '@/lib/useAuth';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Home,
  LogOut,
  Plane,
  Plus,
  Search,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import AddExpenseModal from '@/components/AddExpenseModal';
import ActivityFeed from '@/components/ActivityFeed';
import CreateExpenseSetModal from '@/components/CreateExpenseSetModal';
import ExpenseList from '@/components/ExpenseList';
import ManageExpenseSetMembersModal from '@/components/ManageExpenseSetMembersModal';
import SettlementSummary from '@/components/SettlementSummary';
import TripCloseoutPanel from '@/components/TripCloseoutPanel';
import { ExpenseSet, ExpenseSetMember } from '@/lib/types';

type WorkspaceTab = 'settlements' | 'closeout' | 'activity';
type ExpenseSetView = 'active' | 'closed';

const EXPENSE_SET_PAGE_SIZE = 3;

const supportTabs: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof WalletCards;
}> = [
  { id: 'settlements', label: 'Settle', icon: WalletCards },
  { id: 'closeout', label: 'Closeout', icon: Sparkles },
  { id: 'activity', label: 'Activity', icon: Activity },
];

function getExpenseSetIcon(expenseSet: ExpenseSet) {
  const name = `${expenseSet.name} ${expenseSet.description || ''}`.toLowerCase();
  if (name.includes('trip') || name.includes('travel') || name.includes('vrbo') || name.includes('airbnb')) {
    return Plane;
  }
  if (name.includes('home') || name.includes('house') || name.includes('rent')) {
    return Home;
  }
  if (name.includes('month') || name.includes('week') || name.includes('january') || name.includes('june')) {
    return CalendarDays;
  }
  return UsersRound;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [expenseSets, setExpenseSets] = useState<ExpenseSet[]>([]);
  const [selectedExpenseSetId, setSelectedExpenseSetId] = useState('');
  const [expenseSetCloseouts, setExpenseSetCloseouts] = useState<Record<string, any | null>>({});
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('settlements');
  const [expenseSetView, setExpenseSetView] = useState<ExpenseSetView>('active');
  const [expenseSetSearch, setExpenseSetSearch] = useState('');
  const [currentExpenseSetPage, setCurrentExpenseSetPage] = useState(0);
  const [members, setMembers] = useState<ExpenseSetMember[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCreateSetModal, setShowCreateSetModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [expenseSetsLoading, setExpenseSetsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const selectedExpenseSet = useMemo(
    () => expenseSets.find((expenseSet) => expenseSet.id === selectedExpenseSetId) || null,
    [expenseSets, selectedExpenseSetId]
  );

  const selectedCloseout = selectedExpenseSetId
    ? expenseSetCloseouts[selectedExpenseSetId]
    : null;

  const activeExpenseSets = useMemo(
    () => expenseSets.filter((expenseSet) => !expenseSetCloseouts[expenseSet.id]),
    [expenseSetCloseouts, expenseSets]
  );

  const closedExpenseSets = useMemo(
    () => expenseSets.filter((expenseSet) => expenseSetCloseouts[expenseSet.id]),
    [expenseSetCloseouts, expenseSets]
  );

  const filteredExpenseSets = useMemo(() => {
    const query = expenseSetSearch.trim().toLowerCase();
    const source = expenseSetView === 'active' ? activeExpenseSets : closedExpenseSets;

    if (!query) return source;

    return source.filter((expenseSet) => {
      const searchable = `${expenseSet.name} ${expenseSet.description || ''}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [activeExpenseSets, closedExpenseSets, expenseSetSearch, expenseSetView]);

  const totalExpenseSetPages = Math.max(
    1,
    Math.ceil(filteredExpenseSets.length / EXPENSE_SET_PAGE_SIZE)
  );

  const visibleExpenseSets = filteredExpenseSets.slice(
    currentExpenseSetPage * EXPENSE_SET_PAGE_SIZE,
    (currentExpenseSetPage + 1) * EXPENSE_SET_PAGE_SIZE
  );

  const loadExpenseSets = useCallback(async (preferredExpenseSetId?: string) => {
    if (!user?.id) return;

    setExpenseSetsLoading(true);
    setDashboardError('');
    try {
      const response = await fetch(`/api/expense-sets?userId=${encodeURIComponent(user.id)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load Expense Sets');
      }

      setExpenseSets(payload || []);
      setSelectedExpenseSetId((currentId) => {
        if (preferredExpenseSetId) return preferredExpenseSetId;
        if ((payload || []).some((expenseSet: ExpenseSet) => expenseSet.id === currentId)) {
          return currentId;
        }
        return payload?.[0]?.id || '';
      });
    } catch (err: any) {
      setDashboardError(err.message || 'Failed to load Expense Sets');
    } finally {
      setExpenseSetsLoading(false);
    }
  }, [user?.id]);

  const loadExpenseSetCloseouts = useCallback(async () => {
    if (!user?.id || expenseSets.length === 0) {
      setExpenseSetCloseouts({});
      return;
    }

    const closeoutEntries = await Promise.all(
      expenseSets.map(async (expenseSet) => {
        try {
          const response = await fetch(
            `/api/expense-sets/${expenseSet.id}/closeout?userId=${encodeURIComponent(user.id)}`
          );
          if (!response.ok) {
            return [expenseSet.id, null] as const;
          }
          const payload = await response.json();
          return [expenseSet.id, payload || null] as const;
        } catch {
          return [expenseSet.id, null] as const;
        }
      })
    );

    setExpenseSetCloseouts(Object.fromEntries(closeoutEntries));
  }, [expenseSets, user?.id]);

  const loadMembers = useCallback(async () => {
    if (!user?.id || !selectedExpenseSetId) return;

    setMembersLoading(true);
    try {
      const response = await fetch(
        `/api/expense-sets/${selectedExpenseSetId}/members?userId=${encodeURIComponent(user.id)}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load Expense Set members');
      }

      setMembers(payload || []);
    } catch (err) {
      console.error('Failed to load Expense Set members:', err);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [selectedExpenseSetId, user?.id]);

  const loadExpenses = useCallback(async () => {
    if (!user?.id || !selectedExpenseSetId) return;

    setExpensesLoading(true);
    try {
      const response = await fetch(
        `/api/expenses?userId=${encodeURIComponent(user.id)}&groupId=${encodeURIComponent(selectedExpenseSetId)}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load expenses');
      }

      setExpenses(payload || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  }, [selectedExpenseSetId, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadExpenseSets();
    }
  }, [loadExpenseSets, user?.id]);

  useEffect(() => {
    loadExpenseSetCloseouts();
  }, [loadExpenseSetCloseouts]);

  useEffect(() => {
    setCurrentExpenseSetPage(0);
  }, [expenseSetSearch, expenseSetView]);

  useEffect(() => {
    setCurrentExpenseSetPage((page) => Math.min(page, totalExpenseSetPages - 1));
  }, [totalExpenseSetPages]);

  useEffect(() => {
    if (user?.id && selectedExpenseSetId) {
      loadMembers();
      loadExpenses();
      return;
    }

    setMembers([]);
    setExpenses([]);
  }, [loadExpenses, loadMembers, selectedExpenseSetId, user?.id]);

  const handleExpenseAdded = () => {
    loadExpenses();
    setActivityRefreshKey((key) => key + 1);
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleExpenseSetCreated = (expenseSet: ExpenseSet) => {
    setShowCreateSetModal(false);
    loadExpenseSets(expenseSet.id);
  };

  const handleMembersChanged = () => {
    loadMembers();
    setActivityRefreshKey((key) => key + 1);
  };

  const handleSettlementChanged = () => {
    setActivityRefreshKey((key) => key + 1);
  };

  const handleCloseoutChanged = () => {
    setActivityRefreshKey((key) => key + 1);
    loadExpenseSetCloseouts();
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderExpenseSetButton = (expenseSet: ExpenseSet, isClosed = false) => {
    const Icon = getExpenseSetIcon(expenseSet);
    const isSelected = selectedExpenseSetId === expenseSet.id;

    return (
      <button
        key={expenseSet.id}
        type="button"
        role={isClosed ? undefined : 'tab'}
        aria-selected={isClosed ? undefined : isSelected}
        onClick={() => setSelectedExpenseSetId(expenseSet.id)}
        className={`group w-full min-h-[58px] rounded-xl border p-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary ${
          isSelected
            ? 'border-white bg-white text-gray-950 shadow-md shadow-indigo-950/20'
            : 'border-white/15 bg-white/10 text-white hover:border-white/40 hover:bg-white/15'
        }`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isSelected
                ? isClosed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-indigo-50 text-primary'
                : 'bg-white/15 text-white'
            }`}>
              {isClosed ? <CheckCircle2 size={20} /> : <Icon size={20} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {expenseSet.name}
              </span>
            </span>
          </span>
          <ChevronRight
            size={16}
            className={`shrink-0 transition ${
              isSelected ? 'text-primary' : 'text-white/70 group-hover:text-white'
            }`}
          />
        </span>
      </button>
    );
  };

  const renderSupportPanel = () => {
    if (!selectedExpenseSet) return null;

    if (workspaceTab === 'closeout') {
      return (
        <TripCloseoutPanel
          currentUserId={user?.id || ''}
          expenseSetId={selectedExpenseSetId}
          expenseSetName={selectedExpenseSet.name}
          expenseCount={expenses.length}
          onCloseoutChanged={handleCloseoutChanged}
        />
      );
    }

    if (workspaceTab === 'activity') {
      return (
        <ActivityFeed
          currentUserId={user?.id || ''}
          expenseSetId={selectedExpenseSetId}
          refreshKey={activityRefreshKey}
        />
      );
    }

    return (
      <SettlementSummary
        expenses={expenses}
        currentUserId={user?.id || ''}
        expenseSetId={selectedExpenseSetId}
        onSettlementChanged={handleSettlementChanged}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff_0,#f8fafc_34%,#f1f5f9_100%)]">
      <nav className="sticky top-0 z-20 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <DollarSign size={28} className="text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">ShareExpenses</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Expense Sets</h2>
            <p className="text-gray-600">
              {selectedExpenseSet
                ? `Tracking expenses for ${selectedExpenseSet.name}`
                : 'Create an Expense Set to start tracking shared expenses'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateSetModal(true)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            New Expense Set
          </button>
        </div>

        {dashboardError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {dashboardError}
          </div>
        )}

        {expenseSetsLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Expense Sets...</p>
          </div>
        ) : expenseSets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Expense Sets yet</h3>
            <p className="text-gray-500 mb-4">Create one for a trip, event, month, or shared household.</p>
            <button
              onClick={() => setShowCreateSetModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Expense Set
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
              <aside className="space-y-4">
                <section className="rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-3 text-white shadow-xl shadow-indigo-200/70">
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/15 p-1" aria-label="Expense Set view">
                    <button
                      type="button"
                      onClick={() => setExpenseSetView('active')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        expenseSetView === 'active'
                          ? 'bg-white text-primary shadow-md shadow-indigo-950/10'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >Open</button>
                    <button
                      type="button"
                      onClick={() => setExpenseSetView('closed')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        expenseSetView === 'closed'
                          ? 'bg-white text-emerald-700 shadow-md shadow-indigo-950/10'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >Archive</button>
                  </div>

                  <div className="relative mt-3">
                    <Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-primary/60" />
                    <input
                      type="search"
                      value={expenseSetSearch}
                      onChange={(event) => setExpenseSetSearch(event.target.value)}
                      placeholder="Search Expense Sets"
                      className="w-full rounded-xl border border-white bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-white/70"
                    />
                  </div>

                  <div className="my-3 flex items-center justify-between text-xs font-semibold text-white/75">
                    <span>
                      {filteredExpenseSets.length} {filteredExpenseSets.length === 1 ? 'set' : 'sets'}
                    </span>
                    <span>
                      Page {currentExpenseSetPage + 1} of {totalExpenseSetPages}
                    </span>
                  </div>

                  {visibleExpenseSets.length > 0 ? (
                    <div role="tablist" aria-label="Expense Sets" className="space-y-2">
                      {visibleExpenseSets.map((expenseSet) =>
                        renderExpenseSetButton(expenseSet, expenseSetView === 'closed')
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/35 bg-white/10 p-3 text-sm text-white/80">
                      No matching Expense Sets.
                    </div>
                  )}

                  {filteredExpenseSets.length > EXPENSE_SET_PAGE_SIZE && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentExpenseSetPage((page) => Math.max(0, page - 1))}
                        disabled={currentExpenseSetPage === 0}
                        className="flex items-center justify-center gap-1 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentExpenseSetPage((page) => Math.min(totalExpenseSetPages - 1, page + 1))
                        }
                        disabled={currentExpenseSetPage >= totalExpenseSetPages - 1}
                        className="flex items-center justify-center gap-1 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </section>

                {selectedExpenseSet && (
                  <section className="rounded-lg border border-indigo-100 bg-white/95 p-4 shadow-sm shadow-indigo-100/50">
                    <p className="mb-3 text-sm font-semibold text-gray-900">Selected Set</p>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Members</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-2xl font-bold text-gray-950">{members.length}</p>
                          <button
                            type="button"
                            onClick={() => setShowMembersModal(true)}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                            disabled={membersLoading}
                          >
                            Manage
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Closeout</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-950">
                              {selectedCloseout ? 'Ready' : 'Open'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedCloseout ? 'Saved summary available' : 'Generate when settled'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWorkspaceTab('closeout')}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

              </aside>

              <main>
                <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Expense Ledger</p>
                    <h3 className="text-xl font-bold text-gray-950">
                      {selectedExpenseSet?.name || 'Select an Expense Set'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setShowModal(true);
                    }}
                    className="btn-primary flex items-center justify-center gap-2"
                    disabled={!selectedExpenseSet || membersLoading}
                  >
                    <Plus size={20} />
                    Add Expense
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  {expensesLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading expenses...</p>
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 mb-4">No expenses in this Expense Set yet</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-primary hover:underline font-semibold"
                      >
                        Add the first expense
                      </button>
                    </div>
                  ) : (
                    <ExpenseList
                      expenses={expenses}
                      onRefresh={loadExpenses}
                      currentUserId={user?.id || ''}
                      onEditExpense={handleEditExpense}
                    />
                  )}
                </div>
              </main>

              <aside>
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow">
                  <div className="grid grid-cols-3 gap-2">
                    {supportTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = workspaceTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setWorkspaceTab(tab.id)}
                          className={`flex min-h-[44px] items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                          }`}
                        >
                          <Icon size={16} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    {renderSupportPanel()}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {showModal && selectedExpenseSet && (
        <AddExpenseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingExpense(null);
          }}
          onExpenseAdded={handleExpenseAdded}
          currentUserId={user?.id || ''}
          expenseSetId={selectedExpenseSet.id}
          members={members}
          existingExpense={editingExpense}
        />
      )}

      {showCreateSetModal && (
        <CreateExpenseSetModal
          isOpen={showCreateSetModal}
          onClose={() => setShowCreateSetModal(false)}
          onCreated={handleExpenseSetCreated}
          currentUserId={user?.id || ''}
        />
      )}

      {showMembersModal && selectedExpenseSet && (
        <ManageExpenseSetMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          onMembersChanged={handleMembersChanged}
          expenseSet={selectedExpenseSet}
          members={members}
          currentUserId={user?.id || ''}
        />
      )}
    </div>
  );
}
