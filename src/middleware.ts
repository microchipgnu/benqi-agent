import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the origin making the request
  const origin = request.headers.get('origin') || '*';
  
  // Create response
  const response = NextResponse.next();
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, mb-metadata');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Only apply this middleware to API routes
export const config = {
  matcher: '/api/:path*',
}; 