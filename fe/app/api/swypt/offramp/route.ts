import { NextRequest, NextResponse } from 'next/server';
import { swyptSDK } from '@/lib/services/swypt-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, hash, partyB, tokenAddress } = body;

    // Validate required fields
    if (!chain || !hash || !partyB || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: chain, hash, partyB, tokenAddress' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!partyB.match(/^254[17][0-9]{8}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be in 254XXXXXXXXX format' },
        { status: 400 }
      );
    }

    // Process offramp with Swypt
    const result = await swyptSDK.processOfframp({
      chain,
      hash,
      partyB,
      tokenAddress
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing offramp:', error);
    
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
