import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { validateJoinToken } from '@/lib/joinLinks';
import { insertAuditEvent } from '@/lib/auditTrail';
import { checkApiRateLimit } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const token = validateJoinToken(params.token);
    const body = await request.json();
    const { actorUserId } = body;

    const rateLimit = checkApiRateLimit(request, actorUserId);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!actorUserId) {
      return NextResponse.json({ error: 'actorUserId is required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', actorUserId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      return NextResponse.json(
        { error: 'Create your profile before joining this Expense Set' },
        { status: 400 }
      );
    }

    const { data: expenseSet, error: setError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('join_token', token)
      .maybeSingle();

    if (setError) throw setError;
    if (!expenseSet) {
      return NextResponse.json({ error: 'Join link not found' }, { status: 404 });
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .upsert(
        { group_id: expenseSet.id, user_id: actorUserId },
        { onConflict: 'group_id,user_id' }
      );

    if (memberError) throw memberError;

    await insertAuditEvent(supabase, {
      groupId: expenseSet.id,
      actorUserId,
      action: 'member.joined',
      targetType: 'member',
      targetId: actorUserId,
      metadata: { via: 'join-link' },
    });

    return NextResponse.json({
      expenseSetId: expenseSet.id,
      expenseSetName: expenseSet.name,
      joined: true,
    });
  } catch (error: any) {
    console.error('Join Expense Set error:', error);
    const status = error.message === 'Invalid join link' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
