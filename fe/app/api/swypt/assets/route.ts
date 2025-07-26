import { NextRequest, NextResponse } from 'next/server';
import { swyptSDK } from '@/lib/services/swypt-sdk';

export async function GET() {
  try {
    const assets = await swyptSDK.getSupportedAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching supported assets:', error);
    
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
