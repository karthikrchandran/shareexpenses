'use client';

import { useState, useEffect } from 'react';
import { useAuth, logout } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { Plus, LogOut, DollarSign } from 'lucide-react';
import AddExpenseModal from '@/components/AddExpenseModal';
import ExpenseList from '@/components/ExpenseList';
import SettlementSummary from '@/components/SettlementSummary';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [expensesLoading, setExpensesLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, paid_by_user:users!paid_by_user_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
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
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0">
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Expenses</h2>
            <p className="text-gray-600">Track and split expenses with your friends</p>
          </div>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Expenses List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {expensesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading expenses...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">No expenses yet</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-primary hover:underline font-semibold"
                  >
                    Add your first expense
                  </button>
                </div>
              ) : (
                <ExpenseList
                  expenses={expenses}
                  onRefresh={loadExpenses}
                  currentUserId={user?.id}
                  onEditExpense={handleEditExpense}
                />
              )}
            </div>
          </div>

          {/* Settlement Summary */}
          <div className="md:col-span-1">
            <SettlementSummary expenses={expenses} currentUserId={user?.id} />
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <AddExpenseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingExpense(null);
          }}
          onExpenseAdded={handleExpenseAdded}
          currentUserId={user?.id}
          existingExpense={editingExpense}
        />
      )}
    </div>
  );
}
