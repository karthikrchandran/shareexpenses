import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const { expense_id, splits } = body; // splits: Array<{user_id, amount}>

    if (!expense_id || !splits || !Array.isArray(splits)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const splitRecords = splits.map((split: any) => ({
      expense_id,
      user_id: split.user_id,
      amount: split.amount,
      percentage: split.percentage,
      is_itemized: split.is_itemized || false,
    }));

    const { data, error } = await supabase
      .from('expense_splits')
      .insert(splitRecords)
      .select();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Splits creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('expense_splits')
      .select('*, user:users(*)')
      .eq('expense_id', params.expenseId);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Splits fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
