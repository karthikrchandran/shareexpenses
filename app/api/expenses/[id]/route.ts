import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import {
  ensureActorCanMutateExpense,
  ensureExpenseSetMember,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const { paidByUserId, description, amount, splits, category } = body;

    if (!paidByUserId || !description || !amount || !Array.isArray(splits)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: existingExpense, error: existingExpenseError } = await supabase
      .from('expenses')
      .select('id, paid_by_user_id, group_id')
      .eq('id', params.id)
      .single();

    if (existingExpenseError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const memberIds = await loadExpenseSetMemberIds(supabase, existingExpense.group_id);

    try {
      ensureExpenseSetMember(paidByUserId, memberIds, 'edit expenses');
      ensureActorCanMutateExpense(existingExpense, paidByUserId, 'edit');
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    let expenseCategory: string;
    try {
      expenseCategory = normalizeExpenseCategory(category);
      validateSplitTotal(splits, Number(amount));
      validateSplitParticipants(splits, memberIds);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: expenseUpdateError } = await supabase
      .from('expenses')
      .update({
        description,
        amount,
        category: expenseCategory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (expenseUpdateError) throw expenseUpdateError;

    const { error: splitDeleteError } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', params.id);

    if (splitDeleteError) throw splitDeleteError;

    const splitRows = splits.map((split: any) => ({
      expense_id: params.id,
      user_id: split.user_id,
      amount: split.amount,
      percentage: split.percentage,
      is_itemized: split.is_itemized ?? false,
    }));

    const { error: splitInsertError } = await supabase
      .from('expense_splits')
      .insert(splitRows);

    if (splitInsertError) throw splitInsertError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expense update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { paidByUserId } = body;

    if (!paidByUserId) {
      return NextResponse.json(
        { error: 'Missing paidByUserId' },
        { status: 400 }
      );
    }

    const { data: existingExpense, error: existingExpenseError } = await supabase
      .from('expenses')
      .select('id, paid_by_user_id, group_id')
      .eq('id', params.id)
      .single();

    if (existingExpenseError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const memberIds = await loadExpenseSetMemberIds(supabase, existingExpense.group_id);

    try {
      ensureExpenseSetMember(paidByUserId, memberIds, 'delete expenses');
      ensureActorCanMutateExpense(existingExpense, paidByUserId, 'delete');
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    const { error: splitDeleteError } = await supabase
      .from('expense_splits')
      .delete()
      .eq('expense_id', params.id);

    if (splitDeleteError) throw splitDeleteError;

    const { error: expenseDeleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', params.id);

    if (expenseDeleteError) throw expenseDeleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expense delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
