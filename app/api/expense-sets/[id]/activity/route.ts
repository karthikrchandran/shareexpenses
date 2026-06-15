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
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!(await isExpenseSetMember(supabase, params.id, userId))) {
      return NextResponse.json({ error: 'Expense Set not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('audit_events')
      .select('id, group_id, actor_user_id, action, target_type, target_id, metadata, created_at, actor:users!actor_user_id(id, name, email)')
      .eq('group_id', params.id)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Activity fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
