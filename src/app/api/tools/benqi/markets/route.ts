import { parseUnits } from "viem";
import {
  floatField,
  numberField,
  validateInput,
  addressOrSymbolField,
  type FieldParser,
  signRequestFor,
  getTokenDetails,
  handleRequest,
  type TxData,
} from "@bitte-ai/agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import { 
  depositToMarketsTransaction, 
  borrowFromMarketsTransaction, 
  MarketType 
} from "../util";
import { getTokenMap } from "../../util";

// Interface for market operations input
interface MarketOperationInput {
  chainId: number;
  amount: number; // Token amount in token units
  tokenOrSymbol: string; // Token address or symbol
  marketType: string; // "core" or "ecosystem"
  action: string; // "deposit" or "borrow"
}

// Field parsers for market operations
const marketFieldParsers: FieldParser<MarketOperationInput> = {
  chainId: numberField,
  amount: floatField,
  tokenOrSymbol: addressOrSymbolField,
  marketType: (param: string | null) => {
    if (!param || (param !== "core" && param !== "ecosystem")) {
      throw new Error('marketType must be either "core" or "ecosystem"');
    }
    return param;
  },
  action: (param: string | null) => {
    if (!param || (param !== "deposit" && param !== "borrow")) {
      throw new Error('action must be either "deposit" or "borrow"');
    }
    return param;
  },
};

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, mb-metadata',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// GET endpoint for market operations (deposit and borrow)
export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log("benqi/markets GET request", req.url);
  return handleRequest(req, marketOperationLogic, (result) => NextResponse.json(result));
}

// Logic for market operations
async function marketOperationLogic(req: NextRequest): Promise<TxData> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/markets operation", Object.fromEntries(search.entries()));
  
  const { chainId, amount, tokenOrSymbol, marketType, action } = validateInput<MarketOperationInput>(search, marketFieldParsers);
  
  // Ensure chainId is supported
  if (chainId !== 43114) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Markets. Supported chains: Avalanche (43114)`);
  }
  
  // In ecosystem markets, only USDC can be borrowed
  if (action === "borrow" && marketType === "ecosystem" && tokenOrSymbol.toUpperCase() !== "USDC") {
    throw new Error("Only USDC can be borrowed from Ecosystem Markets");
  }
  
  // Get token details
  let tokenDetails;
  try {
    const tokenMap = await getTokenMap();
    // Convert tokenOrSymbol to lowercase to ensure case-insensitive matching
    const normalizedToken = typeof tokenOrSymbol === 'string' ? tokenOrSymbol.toLowerCase() : tokenOrSymbol;
    tokenDetails = await getTokenDetails(
      chainId,
      normalizedToken,
      tokenMap,
    );
  } catch (error) {
    console.error("Error fetching token details:", error);
    throw new Error(`Failed to fetch token details for ${tokenOrSymbol} on chain ${chainId}`);
  }
  
  if (!tokenDetails) {
    throw new Error(`Token not found on chain ${chainId}: ${tokenOrSymbol}`);
  }
  
  const { symbol, decimals, address } = tokenDetails;
  console.log(`benqi/markets/${action} tokenDetails`, chainId, symbol, decimals, address);
  
  // Convert token amount to smallest units
  const amountInSmallestUnits = parseUnits(amount.toString(), decimals);
  
  // Determine market type enum
  const marketTypeEnum = marketType === "core" ? MarketType.CORE : MarketType.ECOSYSTEM;
  
  if (action === "deposit") {
    return {
      transaction: signRequestFor({
        chainId,
        metaTransactions: [
          depositToMarketsTransaction(address, amountInSmallestUnits, marketTypeEnum, chainId, symbol)
        ],
      }),
      meta: {
        tokenSymbol: symbol,
        amount: amount.toString(),
        marketType: marketType,
        message: `Depositing ${amount} ${symbol} to BENQI ${marketType} Markets`
      }
    };
  } else { // action === "borrow"
    return {
      transaction: signRequestFor({
        chainId,
        metaTransactions: [
          borrowFromMarketsTransaction(address, amountInSmallestUnits, marketTypeEnum, chainId)
        ],
      }),
      meta: {
        tokenSymbol: symbol,
        amount: amount.toString(),
        marketType: marketType,
        message: `Borrowing ${amount} ${symbol} from BENQI ${marketType} Markets`
      }
    };
  }
} 