import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import {
  ensureExpenseSetMember,
  ensureSettlementActorCanRecord,
  validateExpenseSetId,
  validateSettlementParticipants,
} from '@/lib/expenseSetAccess';
import { normalizeSettlementStatus } from '@/lib/settlementPaymentMethods';

async function loadExpenseSetMemberIds(supabase: any, expenseSetId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', expenseSetId);

  if (error) throw error;
  return (data || []).map((member: any) => member.user_id);
}

function validateSettlementAmount(amount: any) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Settlement amount must be greater than zero');
  }

  return Number(numericAmount.toFixed(2));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const userId = request.nextUrl.searchParams.get('userId');
    const groupId = request.nextUrl.searchParams.get('groupId');

    if (!userId || !groupId) {
      return NextResponse.json(
        { error: 'userId and groupId are required' },
        { status: 400 }
      );
    }

    const expenseSetId = validateExpenseSetId(groupId);
    const memberIds = await loadExpenseSetMemberIds(supabase, expenseSetId);

    try {
      ensureExpenseSetMember(userId, memberIds, 'view settlements');
    } catch {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('settlements')
      .select('id, group_id, from_user_id, to_user_id, amount, settled, settled_at, venmo_transaction_id, payment_method, payment_status, created_at')
      .eq('group_id', expenseSetId)
      .order('settled_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Settlements fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const {
      actor_user_id,
      amount,
      from_user_id,
      group_id,
      payment_method,
      payment_status,
      to_user_id,
      venmo_transaction_id,
    } = body;

    if (!actor_user_id || !from_user_id || !to_user_id || !group_id || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const expenseSetId = validateExpenseSetId(group_id);
    const settlementAmount = validateSettlementAmount(amount);
    const normalizedPaymentStatus = normalizeSettlementStatus(payment_status);
    const isSettled = normalizedPaymentStatus !== 'pending';
    const memberIds = await loadExpenseSetMemberIds(supabase, expenseSetId);

    try {
      ensureExpenseSetMember(actor_user_id, memberIds, 'record settlements');
      validateSettlementParticipants(from_user_id, to_user_id, memberIds);
      ensureSettlementActorCanRecord(actor_user_id, from_user_id, to_user_id);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('settlements')
      .insert({
        group_id: expenseSetId,
        from_user_id,
        to_user_id,
        amount: settlementAmount,
        settled: isSettled,
        settled_at: isSettled ? new Date().toISOString() : null,
        payment_method,
        payment_status: normalizedPaymentStatus,
        venmo_transaction_id: venmo_transaction_id || null,
      })
      .select('id, group_id, from_user_id, to_user_id, amount, settled, settled_at, venmo_transaction_id, payment_method, payment_status, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Settlement creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
