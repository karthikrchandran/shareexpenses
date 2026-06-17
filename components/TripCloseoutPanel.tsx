'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TripCloseoutPanelProps {
  currentUserId: string;
  expenseSetId: string;
  expenseSetName: string;
  expenseCount: number;
  onCloseoutChanged?: () => void;
}

export default function TripCloseoutPanel({
  currentUserId,
  expenseSetId,
  expenseSetName,
  expenseCount,
  onCloseoutChanged,
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
      onCloseoutChanged?.();
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
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Closeout ready</p>
              <p className="mt-1 text-xs text-emerald-800">
                {formatCurrency(closeout.summary_json.totalAmount)} across{' '}
                {closeout.summary_json.expenseCount} expense
                {closeout.summary_json.expenseCount === 1 ? '' : 's'}
              </p>
              {closeout.created_at && (
                <p className="mt-1 text-xs text-emerald-700">
                  Generated {new Date(closeout.created_at).toLocaleString()}
                </p>
              )}
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
              {closeout.ai_generated ? 'AI polished' : 'Saved'}
            </span>
          </div>
          <Link
            href={`/closeouts/${closeout.id}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Open visual closeout
            <ExternalLink size={14} />
          </Link>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No saved closeout yet. Generate one when the trip ledger is ready.
        </p>
      )}
    </div>
  );
}
