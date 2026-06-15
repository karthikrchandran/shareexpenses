import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { ensureExpenseSetMember } from '@/lib/expenseSetAccess';

async function loadExpenseSetMemberIds(supabase: any, expenseSetId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', expenseSetId);

  if (error) throw error;
  return (data || []).map((member: any) => member.user_id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: closeout, error: closeoutError } = await supabase
      .from('expense_set_closeouts')
      .select('id, group_id, generated_by, summary_json, ai_model, ai_generated, created_at')
      .eq('id', params.id)
      .maybeSingle();

    if (closeoutError) throw closeoutError;

    if (!closeout) {
      return NextResponse.json({ error: 'Closeout not found' }, { status: 404 });
    }

    const memberIds = await loadExpenseSetMemberIds(supabase, closeout.group_id);

    try {
      ensureExpenseSetMember(userId, memberIds, 'view closeouts');
    } catch {
      return NextResponse.json({ error: 'Closeout not found' }, { status: 404 });
    }

    return NextResponse.json(closeout);
  } catch (error: any) {
    console.error('Saved closeout fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
