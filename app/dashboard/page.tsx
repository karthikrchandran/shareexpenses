'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth, logout } from '@/lib/useAuth';
import { Plus, LogOut, DollarSign, UserPlus } from 'lucide-react';
import AddExpenseModal from '@/components/AddExpenseModal';
import CreateExpenseSetModal from '@/components/CreateExpenseSetModal';
import ExpenseList from '@/components/ExpenseList';
import ManageExpenseSetMembersModal from '@/components/ManageExpenseSetMembersModal';
import SettlementSummary from '@/components/SettlementSummary';
import { ExpenseSet, ExpenseSetMember } from '@/lib/types';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [expenseSets, setExpenseSets] = useState<ExpenseSet[]>([]);
  const [selectedExpenseSetId, setSelectedExpenseSetId] = useState('');
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

  const selectedExpenseSet = useMemo(
    () => expenseSets.find((expenseSet) => expenseSet.id === selectedExpenseSetId) || null,
    [expenseSets, selectedExpenseSetId]
  );

  useEffect(() => {
    if (user?.id) {
      loadExpenseSets();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && selectedExpenseSetId) {
      loadMembers();
      loadExpenses();
      return;
    }

    setMembers([]);
    setExpenses([]);
  }, [user?.id, selectedExpenseSetId]);

  const loadExpenseSets = async (preferredExpenseSetId?: string) => {
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
  };

  const loadMembers = async () => {
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
  };

  const loadExpenses = async () => {
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
  };

  const handleExpenseAdded = () => {
    loadExpenses();
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
  };

  const handleLogout = async () => {
    await logout();
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
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

      <div className="max-w-6xl mx-auto px-6 py-8">
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
            <div className="bg-white rounded-lg shadow p-4 mb-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Expense Set
                  </label>
                  <select
                    value={selectedExpenseSetId}
                    onChange={(event) => setSelectedExpenseSetId(event.target.value)}
                    className="input-field"
                  >
                    {expenseSets.map((expenseSet) => (
                      <option key={expenseSet.id} value={expenseSet.id}>
                        {expenseSet.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="btn-secondary flex items-center justify-center gap-2"
                    disabled={!selectedExpenseSet || membersLoading}
                  >
                    <UserPlus size={20} />
                    Members ({members.length})
                  </button>
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
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
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
              </div>

              <div className="md:col-span-1">
                <SettlementSummary expenses={expenses} currentUserId={user?.id || ''} />
              </div>
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
