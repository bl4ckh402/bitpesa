import { NextRequest, NextResponse } from 'next/server';
import { swyptSDK } from '@/lib/services/swypt-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both orderID-based and direct ticket creation
    if (body.orderID) {
      // Create ticket from existing order
      const { orderID, description, symbol, chain } = body;
      
      const result = await swyptSDK.createOfframpTicket({
        orderID,
        description,
        symbol,
        chain
      });
      
      return NextResponse.json(result);
    } else {
      // Create direct ticket
      const { 
        phone, 
        amount, 
        description, 
        userAddress, 
        symbol, 
        tokenAddress, 
        chain 
      } = body;

      // Validate required fields for direct creation
      if (!phone || !amount || !description || !userAddress || !symbol || !tokenAddress || !chain) {
        return NextResponse.json(
          { error: 'Missing required fields for direct ticket creation' },
          { status: 400 }
        );
      }

      // Validate phone number format
      if (!phone.match(/^254[17][0-9]{8}$/)) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Must be in 254XXXXXXXXX format' },
          { status: 400 }
        );
      }

      const result = await swyptSDK.createOfframpTicket({
        phone,
        amount,
        description,
        side: 'off-ramp',
        userAddress,
        symbol,
        tokenAddress,
        chain
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error creating offramp ticket:', error);
    
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
