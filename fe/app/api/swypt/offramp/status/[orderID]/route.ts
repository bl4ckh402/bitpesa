import { NextRequest, NextResponse } from 'next/server';
import { swyptSDK } from '@/lib/services/swypt-sdk';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderID: string } }
) {
  try {
    const orderID = params.orderID;

    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check offramp status
    const status = await swyptSDK.getOfframpStatus(orderID);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking offramp status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('400') ? 400 : 
                      errorMessage.includes('401') ? 401 : 
                      errorMessage.includes('404') ? 404 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
