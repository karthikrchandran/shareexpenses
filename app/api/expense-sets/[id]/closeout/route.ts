import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { ensureExpenseSetMember } from '@/lib/expenseSetAccess';
import { buildTripCloseoutSummary } from '@/lib/tripCloseout';
import { polishTripCloseoutWithAI } from '@/lib/openaiCloseout';
import { insertAuditEvent } from '@/lib/auditTrail';
import { checkApiRateLimit } from '@/lib/rateLimit';

async function loadExpenseSetMemberIds(supabase: any, expenseSetId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', expenseSetId);

  if (error) throw error;
  return (data || []).map((member: any) => member.user_id);
}

async function ensureMember(supabase: any, expenseSetId: string, userId: string, action: string) {
  const memberIds = await loadExpenseSetMemberIds(supabase, expenseSetId);
  ensureExpenseSetMember(userId, memberIds, action);
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

    try {
      await ensureMember(supabase, params.id, userId, 'view closeouts');
    } catch {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('expense_set_closeouts')
      .select('id, group_id, generated_by, summary_json, ai_model, ai_generated, created_at')
      .eq('group_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(data || null);
  } catch (error: any) {
    console.error('Closeout fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { actorUserId } = body;

    const rateLimit = checkApiRateLimit(request, actorUserId);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!actorUserId) {
      return NextResponse.json({ error: 'actorUserId is required' }, { status: 400 });
    }

    try {
      await ensureMember(supabase, params.id, actorUserId, 'generate closeouts');
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const { data: expenseSet, error: expenseSetError } = await supabase
      .from('groups')
      .select('id, name, description')
      .eq('id', params.id)
      .single();

    if (expenseSetError || !expenseSet) {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id, group_id, user_id, joined_at, user:users(id, email, name)')
      .eq('group_id', params.id)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, group_id, description, amount, category, paid_by_user_id, created_at')
      .eq('group_id', params.id)
      .order('created_at', { ascending: true });

    if (expensesError) throw expensesError;

    if (!expenses || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Add expenses before generating a closeout' },
        { status: 400 }
      );
    }

    const expenseIds = expenses.map((expense: any) => expense.id);

    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount')
      .in('expense_id', expenseIds);

    if (splitsError) throw splitsError;

    const { data: settledPayments, error: settlementsError } = await supabase
      .from('settlements')
      .select('from_user_id, to_user_id, amount, settled')
      .eq('group_id', params.id)
      .eq('settled', true);

    if (settlementsError) throw settlementsError;

    const closeoutMembers = (members || []).map((member: any) => ({
      ...member,
      user: Array.isArray(member.user) ? member.user[0] : member.user,
    }));

    const deterministicSummary = buildTripCloseoutSummary({
      expenseSet,
      expenses,
      members: closeoutMembers,
      splits: splits || [],
      settledPayments: settledPayments || [],
    });
    const polished = await polishTripCloseoutWithAI(deterministicSummary);

    const { data: closeout, error: closeoutError } = await supabase
      .from('expense_set_closeouts')
      .insert({
        group_id: params.id,
        generated_by: actorUserId,
        summary_json: polished.summary,
        ai_model: polished.aiModel,
        ai_generated: polished.aiGenerated,
      })
      .select('id, group_id, generated_by, summary_json, ai_model, ai_generated, created_at')
      .single();

    if (closeoutError) throw closeoutError;

    await insertAuditEvent(supabase, {
      groupId: params.id,
      actorUserId,
      action: 'closeout.generated',
      targetType: 'closeout',
      targetId: closeout.id,
      metadata: {
        ai_generated: polished.aiGenerated,
        ai_model: polished.aiModel,
      },
    });

    return NextResponse.json(closeout, { status: 201 });
  } catch (error: any) {
    console.error('Closeout generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
