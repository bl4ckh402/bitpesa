import { NextRequest, NextResponse } from 'next/server';
import { swyptSDK } from '@/lib/services/swypt-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, fiatCurrency, cryptoCurrency, network, category } = body;

    // Validate required fields
    if (!type || !amount || !fiatCurrency || !cryptoCurrency || !network) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, fiatCurrency, cryptoCurrency, network' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['onramp', 'offramp'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "onramp" or "offramp"' },
        { status: 400 }
      );
    }

    // Get quote from Swypt
    const quote = await swyptSDK.getQuote({
      type,
      amount,
      fiatCurrency,
      cryptoCurrency,
      network,
      category
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error getting Swypt quote:', error);
    
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
