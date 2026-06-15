import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const actorUserId = request.nextUrl.searchParams.get('userId');

    if (!actorUserId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!(await isExpenseSetMember(supabase, params.id, actorUserId))) {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('group_members')
      .select('id, group_id, user_id, joined_at, user:users(id, email, name, venmo_handle)')
      .eq('group_id', params.id)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Expense Set member fetch error:', error);
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
    const { actorUserId, userId } = body;

    if (!actorUserId || !userId) {
      return NextResponse.json(
        { error: 'actorUserId and userId are required' },
        { status: 400 }
      );
    }

    if (!(await isExpenseSetMember(supabase, params.id, actorUserId))) {
      return NextResponse.json(
        { error: 'Only Expense Set members can add members' },
        { status: 403 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;

    if (!user) {
      return NextResponse.json(
        { error: 'User must be registered before they can be added' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('group_members')
      .upsert(
        { group_id: params.id, user_id: userId },
        { onConflict: 'group_id,user_id' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expense Set member add error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
