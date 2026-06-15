'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import TripCloseoutView from '@/components/TripCloseoutView';

interface TripCloseoutPanelProps {
  currentUserId: string;
  expenseSetId: string;
  expenseSetName: string;
  expenseCount: number;
}

export default function TripCloseoutPanel({
  currentUserId,
  expenseSetId,
  expenseSetName,
  expenseCount,
}: TripCloseoutPanelProps) {
  const [closeout, setCloseout] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadLatestCloseout = useCallback(async () => {
    if (!currentUserId || !expenseSetId) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/expense-sets/${expenseSetId}/closeout?userId=${encodeURIComponent(currentUserId)}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load Trip Closeout');
      }
      setCloseout(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to load Trip Closeout');
      setCloseout(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, expenseSetId]);

  useEffect(() => {
    loadLatestCloseout();
  }, [loadLatestCloseout]);

  const generateCloseout = async () => {
    setGenerating(true);
    setError('');
    try {
      const response = await fetch(`/api/expense-sets/${expenseSetId}/closeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorUserId: currentUserId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to generate Trip Closeout');
      }
      setCloseout(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Trip Closeout');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">AI Trip Closeout</h3>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Generate a saved closeout for {expenseSetName}: totals, insights, flags, and a group-ready settlement message.
          </p>
        </div>
        <button
          type="button"
          onClick={generateCloseout}
          disabled={generating || loading || expenseCount === 0}
          className="btn-primary whitespace-nowrap disabled:opacity-50"
        >
          {generating ? 'Generating...' : closeout ? 'Regenerate' : 'Generate Closeout'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {expenseCount === 0 ? (
        <p className="text-sm text-gray-500">Add expenses before generating a closeout.</p>
      ) : loading ? (
        <p className="text-sm text-gray-500">Loading latest closeout...</p>
      ) : closeout ? (
        <>
          <TripCloseoutView closeout={closeout} compact />
          <div className="mt-4">
            <Link
              href={`/closeouts/${closeout.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              View shareable closeout page
              <ExternalLink size={14} />
            </Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          No saved closeout yet. Generate one when the trip ledger is ready.
        </p>
      )}
    </div>
  );
}
