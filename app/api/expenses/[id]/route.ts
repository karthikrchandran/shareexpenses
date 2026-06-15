import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const { paidByUserId, description, amount, splits } = body;

    if (!paidByUserId || !description || !amount || !Array.isArray(splits)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: existingExpense, error: existingExpenseError } = await supabase
      .from('expenses')
      .select('id, paid_by_user_id')
      .eq('id', params.id)
      .single();

    if (existingExpenseError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (existingExpense.paid_by_user_id !== paidByUserId) {
      return NextResponse.json(
        { error: 'Only the expense owner can edit this expense' },
        { status: 403 }
      );
    }

    const splitTotal = splits.reduce((sum: number, split: any) => sum + Number(split.amount || 0), 0);
    if (Math.abs(splitTotal - Number(amount)) > 0.01) {
      return NextResponse.json(
        { error: 'Split total must equal expense amount' },
        { status: 400 }
      );
    }

    const { error: expenseUpdateError } = await supabase
      .from('expenses')
      .update({
        description,
        amount,
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
      .select('id, paid_by_user_id')
      .eq('id', params.id)
      .single();

    if (existingExpenseError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (existingExpense.paid_by_user_id !== paidByUserId) {
      return NextResponse.json(
        { error: 'Only the expense owner can delete this expense' },
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
