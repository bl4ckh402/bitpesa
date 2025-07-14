import { NextRequest, NextResponse } from 'next/server';
import { lightningService } from '@/lib/services/lightning-service';
import { storeTransaction, TransactionType, updateTransactionWithMpesaInfo } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('webhook-signature') || '';
    const timestamp = request.headers.get('webhook-timestamp') || '';
    const webhookId = request.headers.get('webhook-id') || '';
    
    // Get webhook secret from environment
    const webhookSecret = process.env.SPEED_WEBHOOK_SECRET || '';
    
    // Verify webhook signature
    const isValidSignature = lightningService.verifyWebhookSignature(
      body,
      signature,
      timestamp,
      webhookId,
      webhookSecret
    );
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const event = JSON.parse(body);
    
    console.log('Received Speed webhook:', {
      type: event.event_type,
      id: event.data?.id,
      status: event.data?.status,
    });
    
    // Handle different event types
    switch (event.event_type) {
      case 'payment.created':
        await handlePaymentCreated(event.data);
        break;
        
      case 'payment.paid':
        await handlePaymentPaid(event.data);
        break;
        
      case 'payment.expired':
        await handlePaymentExpired(event.data);
        break;
        
      case 'payment.cancelled':
        await handlePaymentCancelled(event.data);
        break;
        
      default:
        console.log('Unhandled event type:', event.event_type);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCreated(payment: any) {
  console.log('Payment created:', payment.id);
  
  if (payment.metadata?.type === 'collateral_deposit') {
    // Store the initial transaction record
    await storeTransaction({
      user_address: payment.metadata.user_address,
      transaction_type: TransactionType.COLLATERAL_DEPOSITED,
      amount: payment.metadata.original_amount,
      token_symbol: payment.metadata.collateral_type,
      token_decimals: 18,
      tx_hash: payment.id,
    });
  }
}

async function handlePaymentPaid(payment: any) {
  console.log('Payment paid:', payment.id);
  
  if (payment.metadata?.type === 'collateral_deposit') {
    // Update transaction status
    await updateTransactionWithMpesaInfo(payment.id, {
      mpesa_phone_number: 'lightning_network',
      mpesa_transaction_id: payment.id,
      mpesa_checkout_request_id: payment.payment_method_options?.lightning?.id || '',
      mpesa_amount: payment.target_amount_paid?.toString() || '',
      status: 'completed',
    });
    
    // Here you could trigger additional logic like:
    // 1. Notifying the frontend via websockets
    // 2. Triggering the on-chain deposit automatically
    // 3. Sending confirmation emails
    
    console.log('Collateral deposit payment confirmed:', {
      paymentId: payment.id,
      userAddress: payment.metadata.user_address,
      amount: payment.metadata.original_amount,
      paidAmount: payment.target_amount_paid,
    });
  }
}

async function handlePaymentExpired(payment: any) {
  console.log('Payment expired:', payment.id);
  
  if (payment.metadata?.type === 'collateral_deposit') {
    await updateTransactionWithMpesaInfo(payment.id, {
      status: 'expired',
    });
  }
}

async function handlePaymentCancelled(payment: any) {
  console.log('Payment cancelled:', payment.id);
  
  if (payment.metadata?.type === 'collateral_deposit') {
    await updateTransactionWithMpesaInfo(payment.id, {
      status: 'cancelled',
    });
  }
}

// Disable body parsing for webhook signatures
export const runtime = 'edge';
