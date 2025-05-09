import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import {
  loadTokenMap,
  validateRequest,
  BlockchainMapping,
} from "@bitte-ai/agent-sdk";

export async function validateNextRequest(
  req: NextRequest,
): Promise<NextResponse | null> {
  return validateRequest<NextRequest, NextResponse>(
    req,
    (data: unknown, init?: { status?: number }) =>
      NextResponse.json(data, init),
  );
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}
export function getZerionKey(): string {
  return getEnvVar("ZERION_KEY");
}

export function getSafeSaltNonce(): string {
  const bitteProtocolSaltNonce = "130811896738364156958237239906781888512";
  return process.env.SAFE_SALT_NONCE || bitteProtocolSaltNonce;
}

// Global variable to store the token map in memory
let tokenMapCache: BlockchainMapping | null = null;
let tokenMapLastFetch = 0;
const TOKEN_MAP_CACHE_TTL = 3600000; // 1 hour in milliseconds

export async function getTokenMap(): Promise<BlockchainMapping> {
  // Use in-memory caching instead of Next.js cache
  const now = Date.now();
  
  // If we have a cached token map that's still fresh, return it
  if (tokenMapCache && (now - tokenMapLastFetch < TOKEN_MAP_CACHE_TTL)) {
    return tokenMapCache;
  }
  
  // Otherwise, fetch a new token map
  console.log("Loading TokenMap...");
  tokenMapCache = await loadTokenMap(getEnvVar("TOKEN_MAP_URL"));
  tokenMapLastFetch = now;
  
  return tokenMapCache;
}
