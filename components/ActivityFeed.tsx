'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ActivityFeedProps {
  currentUserId: string;
  expenseSetId: string;
  refreshKey?: number;
}

const ACTION_LABELS: Record<string, string> = {
  'expense.created': 'added an expense',
  'expense.updated': 'updated an expense',
  'expense.deleted': 'deleted an expense',
  'member.added': 'added a member',
  'member.joined': 'joined from a link',
  'settlement.recorded': 'recorded a settlement',
  'closeout.generated': 'generated a closeout',
  'expense-set.created': 'created the Expense Set',
};

export default function ActivityFeed({
  currentUserId,
  expenseSetId,
  refreshKey = 0,
}: ActivityFeedProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!currentUserId || !expenseSetId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/expense-sets/${expenseSetId}/activity?userId=${encodeURIComponent(currentUserId)}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load activity');
      }
      setEvents(payload || []);
    } catch (error) {
      console.error('Failed to load activity:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, expenseSetId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity, refreshKey]);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 size={18} className="text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading activity...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 8).map((event) => (
            <div key={event.id} className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-900">
                {event.actor?.name || event.actor?.email || 'Someone'}{' '}
                {ACTION_LABELS[event.action] || event.action}
              </p>
              {event.metadata?.description && (
                <p className="mt-1 text-xs text-gray-600">{event.metadata.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{formatDate(event.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
