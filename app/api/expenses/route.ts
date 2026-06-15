import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import {
  ensureExpenseSetMember,
  validateExpenseSetId,
  validateSplitParticipants,
  validateSplitTotal,
} from '@/lib/expenseSetAccess';
import { normalizeExpenseCategory } from '@/lib/expenseCategories';

async function loadExpenseSetMemberIds(supabase: any, expenseSetId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', expenseSetId);

  if (error) throw error;
  return (data || []).map((member: any) => member.user_id);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const { description, amount, paid_by_user_id, group_id, splits, category } = body;

    if (!description || !amount || !paid_by_user_id || !Array.isArray(splits)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let expenseSetId: string;
    let expenseCategory: string;
    try {
      expenseSetId = validateExpenseSetId(group_id);
      expenseCategory = normalizeExpenseCategory(category);
      validateSplitTotal(splits, Number(amount));
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const memberIds = await loadExpenseSetMemberIds(supabase, expenseSetId);

    try {
      ensureExpenseSetMember(paid_by_user_id, memberIds, 'add expenses');
      validateSplitParticipants(splits, memberIds);
    } catch (error: any) {
      const status = error.message.startsWith('Only Expense Set members') ? 403 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    const { data: expenseData, error } = await supabase
      .from('expenses')
      .insert({
        description,
        amount,
        category: expenseCategory,
        paid_by_user_id,
        group_id: expenseSetId,
      })
      .select()
      .single();

    if (error) throw error;

    const splitRows = splits.map((split: any) => ({
      expense_id: expenseData.id,
      user_id: split.user_id,
      amount: split.amount,
      percentage: split.percentage,
      is_itemized: split.is_itemized ?? false,
    }));

    const { error: splitError } = await supabase
      .from('expense_splits')
      .insert(splitRows);

    if (splitError) throw splitError;

    return NextResponse.json(expenseData, { status: 201 });
  } catch (error: any) {
    console.error('Expense creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
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
      ensureExpenseSetMember(userId, memberIds, 'view expenses');
    } catch (error: any) {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*, paid_by_user:users!paid_by_user_id(*)')
      .eq('group_id', expenseSetId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Expenses fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
