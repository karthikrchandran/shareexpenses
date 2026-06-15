'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, DollarSign, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

export default function JoinExpenseSetPage({ params }: { params: { token: string } }) {
  const { user, loading } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joinedSet, setJoinedSet] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const joinExpenseSet = async () => {
      if (!user?.id || joinedSet || joining) return;

      setJoining(true);
      setError('');

      try {
        const response = await fetch(`/api/expense-sets/join/${params.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actorUserId: user.id }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to join Expense Set');
        }

        setJoinedSet({
          id: payload.expenseSetId,
          name: payload.expenseSetName,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to join Expense Set');
      } finally {
        setJoining(false);
      }
    };

    joinExpenseSet();
  }, [joinedSet, joining, params.token, user?.id]);

  if (loading || joining) {
    return (
      <JoinShell>
        <Loader2 size={32} className="mx-auto animate-spin text-primary" />
        <h1 className="mt-4 text-2xl font-bold text-gray-950">Joining Expense Set</h1>
        <p className="mt-2 text-sm text-gray-600">Checking your invite link and adding you to the trip.</p>
      </JoinShell>
    );
  }

  if (error) {
    return (
      <JoinShell>
        <Users size={32} className="mx-auto text-amber-700" />
        <h1 className="mt-4 text-2xl font-bold text-gray-950">Could not join</h1>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex justify-center">
          Back to dashboard
        </Link>
      </JoinShell>
    );
  }

  return (
    <JoinShell>
      <CheckCircle2 size={36} className="mx-auto text-emerald-700" />
      <h1 className="mt-4 text-2xl font-bold text-gray-950">You are in</h1>
      <p className="mt-2 text-sm text-gray-600">
        {joinedSet ? `You joined ${joinedSet.name}.` : 'Your invite is ready.'}
      </p>
      <Link href="/dashboard" className="btn-primary mt-6 inline-flex justify-center">
        Open dashboard
      </Link>
    </JoinShell>
  );
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
          <DollarSign size={28} className="text-primary" />
          <span className="text-2xl font-bold text-gray-900">ShareExpenses</span>
        </div>
      </nav>
      <main className="mx-auto flex max-w-lg items-center px-6 py-16">
        <div className="w-full rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
