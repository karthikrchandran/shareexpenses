import { NextRequest, NextResponse } from 'next/server';
import { venmoClient } from '@/lib/venmo';
import { createServiceRoleClient } from '@/lib/supabase';

/**
 * POST /api/venmo/pay
 * Create a Venmo payment for settlement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_user_id, amount, from_user_id, settlement_id } = body;

    if (!to_user_id || !amount || !from_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get recipient user info
    const { data: toUser, error: toUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', to_user_id)
      .single();

    if (toUserError || !toUser) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Create Venmo payment
    const venmoPayment = await venmoClient.createPayment({
      user_id: to_user_id,
      amount,
      note: `ShareExpenses settlement`,
      access_token: process.env.VENMO_ACCESS_TOKEN || '',
    });

    // Record settlement
    if (settlement_id) {
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          venmo_transaction_id: venmoPayment.id,
          settled: true,
          settled_at: new Date().toISOString(),
        })
        .eq('id', settlement_id);

      if (updateError) console.error('Settlement update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      venmoTransactionId: venmoPayment.id,
      message: 'Payment created successfully',
    });
  } catch (error: any) {
    console.error('Venmo payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Venmo payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/venmo/payment/:id
 * Get payment status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    const payment = await venmoClient.getPaymentStatus(paymentId);

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('Venmo fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
