'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Cog,
  Copy,
  ExternalLink,
  Gauge,
  PieChart,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
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
}

const CATEGORY_COLORS: Record<string, { hex: string; bar: string; soft: string }> = {
  lodging: { hex: '#2563eb', bar: 'bg-blue-600', soft: 'bg-blue-50 text-blue-800 border-blue-200' },
  food: { hex: '#dc2626', bar: 'bg-red-600', soft: 'bg-red-50 text-red-800 border-red-200' },
  groceries: { hex: '#16a34a', bar: 'bg-green-600', soft: 'bg-green-50 text-green-800 border-green-200' },
  fuel: { hex: '#d97706', bar: 'bg-amber-600', soft: 'bg-amber-50 text-amber-900 border-amber-200' },
  miscellaneous: { hex: '#7c3aed', bar: 'bg-violet-600', soft: 'bg-violet-50 text-violet-800 border-violet-200' },
};

export default function TripCloseoutView({ closeout }: TripCloseoutViewProps) {
  const summary = closeout.summary_json;
  const sharePath = closeout.id ? `/closeouts/${closeout.id}` : '';
  const activeCategories = summary.categoryTotals.filter((category) => category.total > 0);
  const topCategory = activeCategories.reduce<(typeof activeCategories)[number] | undefined>(
    (largest, category) => (!largest || category.total > largest.total ? category : largest),
    undefined
  );
  const settlementTotal = summary.settlements.reduce((sum, settlement) => sum + settlement.amount, 0);
  const perPersonAverage = summary.memberCount > 0 ? summary.totalAmount / summary.memberCount : 0;
  const donutBackground = buildDonutBackground(activeCategories);

  const copyGroupMessage = async () => {
    await navigator.clipboard.writeText(summary.groupMessage);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles size={14} />
                {closeout.ai_generated ? `AI polished${closeout.ai_model ? ` with ${closeout.ai_model}` : ''}` : 'Deterministic closeout'}
              </span>
              {summary.flags.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  <AlertTriangle size={14} />
                  {summary.flags.length} review flag{summary.flags.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-950">Closeout dashboard</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">{summary.narrative}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total shared spend</p>
                <p className="mt-1 text-3xl font-bold text-gray-950">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <div className="rounded-full bg-white p-3 text-primary shadow-sm">
                <Gauge size={28} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-gray-500">Per person avg</p>
                <p className="font-semibold text-gray-950">{formatCurrency(perPersonAverage)}</p>
              </div>
              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-gray-500">To settle</p>
                <p className="font-semibold text-gray-950">{formatCurrency(settlementTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={<Receipt size={20} />} label="Expenses" value={String(summary.expenseCount)} detail="Logged in this set" tone="text-sky-700 bg-sky-50" />
        <MetricTile icon={<Users size={20} />} label="People" value={String(summary.memberCount)} detail="Included in split" tone="text-emerald-700 bg-emerald-50" />
        <MetricTile icon={<TrendingUp size={20} />} label="Top category" value={topCategory ? topCategory.label : 'None'} detail={topCategory ? `${topCategory.percentage.toFixed(1)}% of spend` : 'No spend yet'} tone="text-violet-700 bg-violet-50" />
        <MetricTile icon={<Cog size={20} />} label="Settlement moves" value={String(summary.settlements.length)} detail="Payments to close books" tone="text-amber-800 bg-amber-50" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-primary" />
            <h3 className="font-semibold text-gray-950">Spend mix</h3>
          </div>
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: donutBackground }}>
              <div className="absolute inset-8 rounded-full bg-white shadow-inner" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-950">{formatCurrency(summary.totalAmount)}</p>
              </div>
            </div>
            <div className="w-full space-y-2">
              {activeCategories.map((category) => {
                const color = CATEGORY_COLORS[category.category] || CATEGORY_COLORS.miscellaneous;
                return (
                  <div key={category.category} className={`rounded-md border px-3 py-2 ${color.soft}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{category.label}</span>
                      <span className="text-sm font-bold">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <p className="mt-1 text-xs">{formatCurrency(category.total)} across {category.expenseCount} expense{category.expenseCount === 1 ? '' : 's'}</p>
                  </div>
                );
              })}
              {activeCategories.length === 0 && <p className="text-sm text-gray-500">No category spend yet.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-semibold text-gray-950">Category totals</h3>
          </div>
          <div className="space-y-4">
            {activeCategories.map((category) => {
              const color = CATEGORY_COLORS[category.category] || CATEGORY_COLORS.miscellaneous;
              return (
                <div key={category.category}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-800">{category.label}</span>
                    <span className="font-semibold text-gray-950">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${color.bar}`}
                      style={{ width: `${Math.max(category.percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {activeCategories.length === 0 && <p className="text-sm text-gray-500">No category totals available.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ArrowRight size={18} className="text-primary" />
            <h3 className="font-semibold text-gray-950">Final settlement path</h3>
          </div>
          {summary.settlements.length === 0 ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              No outstanding payments. The group is settled.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.settlements.map((settlement) => (
                <div
                  key={`${settlement.fromUserId}-${settlement.toUserId}-${settlement.amount}`}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="truncate text-sm font-semibold text-gray-950">{settlement.fromName}</p>
                  <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-primary shadow-sm">
                    {formatCurrency(settlement.amount)}
                    <ArrowRight size={14} />
                  </div>
                  <p className="truncate text-right text-sm font-semibold text-gray-950">{settlement.toName}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-950">Insight highlights</h3>
          <div className="space-y-3">
            {summary.insights.map((insight) => (
              <div key={insight} className="flex gap-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-950">Largest expenses</h3>
          <div className="space-y-3">
            {summary.largestExpenses.map((expense, index) => (
              <div key={expense.id} className="flex items-center justify-between gap-4 rounded-md bg-gray-50 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700 shadow-sm">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.categoryLabel} paid by {expense.paidByName}</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold text-gray-950">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className={summary.flags.length > 0 ? 'text-amber-700' : 'text-emerald-700'} />
            <h3 className="font-semibold text-gray-950">Review indicators</h3>
          </div>
          {summary.flags.length > 0 ? (
            <div className="space-y-3">
              {summary.flags.map((flag) => (
                <div key={flag} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {flag}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              No duplicate or partial-split indicators were detected.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-950">Group-ready settlement message</h3>
          <button
            type="button"
            onClick={copyGroupMessage}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Copy size={14} />
            Copy message
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-700">{summary.groupMessage}</pre>
      </section>

      {sharePath && (
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

function MetricTile({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 truncate text-xl font-bold text-gray-950">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{detail}</p>
        </div>
        <div className={`rounded-full p-2 ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}

function buildDonutBackground(categories: TripCloseoutSummary['categoryTotals']) {
  if (categories.length === 0) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)';
  }

  let cursor = 0;
  const stops = categories.map((category) => {
    const color = CATEGORY_COLORS[category.category]?.hex || CATEGORY_COLORS.miscellaneous.hex;
    const start = cursor;
    const end = cursor + category.percentage * 3.6;
    cursor = end;
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}
