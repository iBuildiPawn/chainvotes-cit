import { NextRequest, NextResponse } from 'next/server'
import { RPC_URL } from '@/lib/config'

export const runtime = 'edge'

// Fallback RPC endpoints if the primary one fails
const FALLBACK_ENDPOINTS = [
  'https://eth-sepolia.g.alchemy.com/v2/demo',
  'https://rpc.sepolia.org',
  'https://rpc2.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
]

// Helper function to attempt an RPC request with a specific endpoint
async function attemptRpcRequest(endpoint: string, body: any) {
  console.log(`Attempting RPC request to ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      console.error(`HTTP error from ${endpoint}: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successful response from ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`RPC request to ${endpoint} failed:`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const rpcRequest = await req.json();
  console.log(`RPC proxy received request: ${rpcRequest.method}`);
  
  // Try the primary RPC endpoint first
  try {
    console.log(`Using primary RPC endpoint: ${RPC_URL}`);
    const data = await attemptRpcRequest(RPC_URL, rpcRequest);
    
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (primaryError) {
    console.error('Primary RPC endpoint failed, trying fallbacks');
    
    // Try each fallback endpoint in sequence
    for (const fallbackEndpoint of FALLBACK_ENDPOINTS) {
      try {
        console.log(`Trying fallback endpoint: ${fallbackEndpoint}`);
        const data = await attemptRpcRequest(fallbackEndpoint, rpcRequest);
        
        return new NextResponse(JSON.stringify(data), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0'
          }
        });
      } catch (fallbackError) {
        console.error(`Fallback endpoint ${fallbackEndpoint} failed`);
        // Continue to the next fallback
        continue;
      }
    }
    
    // If all endpoints fail, return an error
    console.error('All RPC endpoints failed');
    return NextResponse.json(
      { 
        error: 'Failed to proxy RPC request to any endpoint',
        jsonrpc: '2.0',
        id: rpcRequest.id || null,
        result: null
      },
      { 
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}