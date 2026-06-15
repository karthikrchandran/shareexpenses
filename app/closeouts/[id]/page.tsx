'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign } from 'lucide-react';
import TripCloseoutView from '@/components/TripCloseoutView';
import { useAuth } from '@/lib/useAuth';

export default function CloseoutPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const [closeout, setCloseout] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const loadCloseout = async () => {
      if (!user?.id) return;

      setPageLoading(true);
      setError('');
      try {
        const response = await fetch(
          `/api/closeouts/${params.id}?userId=${encodeURIComponent(user.id)}`
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load closeout');
        }
        setCloseout(payload);
      } catch (err: any) {
        setError(err.message || 'Failed to load closeout');
      } finally {
        setPageLoading(false);
      }
    };

    loadCloseout();
  }, [params.id, user?.id]);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading closeout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <DollarSign size={28} className="text-primary" />
            <span className="text-2xl font-bold text-gray-900">ShareExpenses</span>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : closeout ? (
          <>
            <div className="mb-6">
              <p className="text-sm font-medium text-primary">Saved Trip Closeout</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {closeout.summary_json.expenseSetName}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Generated {new Date(closeout.created_at).toLocaleString()}
              </p>
            </div>
            <TripCloseoutView closeout={closeout} />
          </>
        ) : (
          <p className="text-gray-600">Closeout not found.</p>
        )}
      </main>
    </div>
  );
}
