import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, joined_at, groups(id, name, description, created_by, created_at)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const expenseSets = (data || [])
      .map((row: any) => row.groups)
      .filter(Boolean);

    return NextResponse.json(expenseSets);
  } catch (error: any) {
    console.error('Expense Set fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { name, description, createdByUserId, memberIds = [] } = body;

    if (!name || !createdByUserId) {
      return NextResponse.json(
        { error: 'Name and createdByUserId are required' },
        { status: 400 }
      );
    }

    const uniqueMemberIds = [
      ...new Set([createdByUserId, ...memberIds].filter(Boolean)),
    ];

    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', uniqueMemberIds);

    if (usersError) throw usersError;

    if ((existingUsers || []).length !== uniqueMemberIds.length) {
      return NextResponse.json(
        { error: 'All Expense Set members must be registered users' },
        { status: 400 }
      );
    }

    const { data: expenseSet, error: setError } = await supabase
      .from('groups')
      .insert({
        name,
        description: description || null,
        created_by: createdByUserId,
      })
      .select()
      .single();

    if (setError) throw setError;

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(
        uniqueMemberIds.map((userId) => ({
          group_id: expenseSet.id,
          user_id: userId,
        }))
      );

    if (membersError) throw membersError;

    return NextResponse.json(expenseSet, { status: 201 });
  } catch (error: any) {
    console.error('Expense Set creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
