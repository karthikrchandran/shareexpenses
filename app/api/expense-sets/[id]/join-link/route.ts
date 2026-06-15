import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { buildJoinUrl, createJoinToken } from '@/lib/joinLinks';

async function isExpenseSetMember(
  supabase: ReturnType<typeof createServiceRoleClient>,
  setId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', setId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { actorUserId, regenerate = false } = body;

    if (!actorUserId) {
      return NextResponse.json({ error: 'actorUserId is required' }, { status: 400 });
    }

    if (!(await isExpenseSetMember(supabase, params.id, actorUserId))) {
      return NextResponse.json(
        { error: 'Only Expense Set members can create join links' },
        { status: 403 }
      );
    }

    const { data: expenseSet, error: loadError } = await supabase
      .from('groups')
      .select('id, join_token')
      .eq('id', params.id)
      .single();

    if (loadError || !expenseSet) {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    let joinToken = expenseSet.join_token;
    if (!joinToken || regenerate) {
      joinToken = createJoinToken();
      const { error: updateError } = await supabase
        .from('groups')
        .update({ join_token: joinToken })
        .eq('id', params.id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      joinToken,
      joinUrl: buildJoinUrl({ appUrl: getAppUrl(request), token: joinToken }),
    });
  } catch (error: any) {
    console.error('Join link creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
