'use client';

import Link from 'next/link';
import { Copy, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { TripCloseoutSummary } from '@/lib/tripCloseout';

interface TripCloseoutViewProps {
  closeoutId?: string;
  closeout: {
    id?: string;
    summary_json: TripCloseoutSummary;
    ai_generated?: boolean;
    ai_model?: string | null;
    created_at?: string;
  };
  compact?: boolean;
}

export default function TripCloseoutView({ closeout, compact = false }: TripCloseoutViewProps) {
  const summary = closeout.summary_json;
  const sharePath = closeout.id ? `/closeouts/${closeout.id}` : '';

  const copyGroupMessage = async () => {
    await navigator.clipboard.writeText(summary.groupMessage);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Sparkles size={18} />
              <h3 className="font-semibold">Trip Closeout</h3>
            </div>
            <p className="mt-1 text-sm text-emerald-900">{summary.narrative}</p>
            <p className="mt-2 text-xs text-emerald-700">
              {closeout.ai_generated ? `AI polished with ${closeout.ai_model}` : 'Deterministic summary'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-emerald-700">Total shared spend</p>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(summary.totalAmount)}</p>
          </div>
        </div>
      </div>

      <div className={compact ? 'space-y-4' : 'grid gap-4 lg:grid-cols-2'}>
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-3 font-semibold text-gray-900">Category Totals</h4>
          <div className="space-y-2">
            {summary.categoryTotals
              .filter((category) => category.total > 0)
              .map((category) => (
                <div key={category.category} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-500">{category.expenseCount} expense{category.expenseCount === 1 ? '' : 's'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(category.total)}</p>
                    <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-3 font-semibold text-gray-900">Final Settlements</h4>
          {summary.settlements.length === 0 ? (
            <p className="text-sm text-gray-500">No outstanding payments.</p>
          ) : (
            <div className="space-y-2">
              {summary.settlements.map((settlement) => (
                <div
                  key={`${settlement.fromUserId}-${settlement.toUserId}-${settlement.amount}`}
                  className="rounded-md bg-gray-50 p-3 text-sm"
                >
                  <span className="font-semibold text-gray-900">{settlement.fromName}</span>
                  <span className="text-gray-600"> pays </span>
                  <span className="font-semibold text-gray-900">{settlement.toName}</span>
                  <span className="font-semibold text-primary"> {formatCurrency(settlement.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {!compact && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-gray-900">Insight Highlights</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {summary.insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-gray-900">Largest Expenses</h4>
            <div className="space-y-2">
              {summary.largestExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.categoryLabel} paid by {expense.paidByName}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {summary.flags.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-900">
            <AlertTriangle size={16} />
            <h4 className="font-semibold">Review Flags</h4>
          </div>
          <ul className="space-y-1 text-sm text-amber-900">
            {summary.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="font-semibold text-gray-900">Group Message</h4>
          <button
            type="button"
            onClick={copyGroupMessage}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700">{summary.groupMessage}</pre>
      </section>

      {sharePath && !compact && (
        <Link
          href={sharePath}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Open shareable closeout page
          <ExternalLink size={14} />
        </Link>
      )}
    </div>
  );
}
