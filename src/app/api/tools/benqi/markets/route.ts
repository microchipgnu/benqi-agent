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

// Interface for deposit (supply) operation
interface DepositInput {
  chainId: number;
  amount: number; // Token amount in token units
  tokenOrSymbol: string; // Token address or symbol
  marketType: string; // "core" or "ecosystem"
}

// Interface for borrow operation
interface BorrowInput {
  chainId: number;
  amount: number; // Token amount in token units
  tokenOrSymbol: string; // Token address or symbol
  marketType: string; // "core" or "ecosystem"
}

// Field parsers for deposit operation
const depositFieldParsers: FieldParser<DepositInput> = {
  chainId: numberField,
  amount: floatField,
  tokenOrSymbol: addressOrSymbolField,
  marketType: (param: string | null) => {
    if (!param || (param !== "core" && param !== "ecosystem")) {
      throw new Error('marketType must be either "core" or "ecosystem"');
    }
    return param;
  },
};

// Field parsers for borrow operation
const borrowFieldParsers: FieldParser<BorrowInput> = {
  chainId: numberField,
  amount: floatField,
  tokenOrSymbol: addressOrSymbolField,
  marketType: (param: string | null) => {
    if (!param || (param !== "core" && param !== "ecosystem")) {
      throw new Error('marketType must be either "core" or "ecosystem"');
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

// GET endpoint for deposit (supply) operation
export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log("benqi/markets GET request", req.url);
  return handleRequest(req, depositLogic, (result) => NextResponse.json(result));
}

// POST endpoint for borrow operation
export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log("benqi/markets POST request", req.url);
  return handleRequest(req, borrowLogic, (result) => NextResponse.json(result));
}

// Logic for deposit (supply) operation
async function depositLogic(req: NextRequest): Promise<TxData> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/markets/deposit", search);
  
  const { chainId, amount, tokenOrSymbol, marketType } = validateInput<DepositInput>(search, depositFieldParsers);
  
  // Ensure chainId is supported
  if (chainId !== 43114 && chainId !== 43113) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Markets. Supported chains: Avalanche (43114) and Fuji Testnet (43113)`);
  }
  
  // Get token details
  const tokenDetails = await getTokenDetails(
    chainId,
    tokenOrSymbol,
    await getTokenMap(),
  );
  
  if (!tokenDetails) {
    throw new Error(`Token not found on chain ${chainId}: ${tokenOrSymbol}`);
  }
  
  const { symbol, decimals, address } = tokenDetails;
  console.log("benqi/markets/deposit tokenDetails", chainId, symbol, decimals, address);
  
  // Convert token amount to smallest units
  const amountInSmallestUnits = parseUnits(amount.toString(), decimals);
  
  // Determine market type enum
  const marketTypeEnum = marketType === "core" ? MarketType.CORE : MarketType.ECOSYSTEM;
  
  return {
    transaction: signRequestFor({
      chainId,
      metaTransactions: [
        depositToMarketsTransaction(address, amountInSmallestUnits, marketTypeEnum, chainId)
      ],
    }),
    meta: {
      tokenSymbol: symbol,
      amount: amount.toString(),
      marketType: marketType,
      message: `Depositing ${amount} ${symbol} to BENQI ${marketType} Markets`
    }
  };
}

// Logic for borrow operation
async function borrowLogic(req: NextRequest): Promise<TxData> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/markets/borrow", search);
  
  const { chainId, amount, tokenOrSymbol, marketType } = validateInput<BorrowInput>(search, borrowFieldParsers);
  
  // Ensure chainId is supported
  if (chainId !== 43114 && chainId !== 43113) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Markets. Supported chains: Avalanche (43114) and Fuji Testnet (43113)`);
  }
  
  // In ecosystem markets, only USDC can be borrowed
  if (marketType === "ecosystem" && tokenOrSymbol.toUpperCase() !== "USDC") {
    throw new Error("Only USDC can be borrowed from Ecosystem Markets");
  }
  
  // Get token details
  const tokenDetails = await getTokenDetails(
    chainId,
    tokenOrSymbol,
    await getTokenMap(),
  );
  
  if (!tokenDetails) {
    throw new Error(`Token not found on chain ${chainId}: ${tokenOrSymbol}`);
  }
  
  const { symbol, decimals, address } = tokenDetails;
  console.log("benqi/markets/borrow tokenDetails", chainId, symbol, decimals, address);
  
  // Convert token amount to smallest units
  const amountInSmallestUnits = parseUnits(amount.toString(), decimals);
  
  // Determine market type enum
  const marketTypeEnum = marketType === "core" ? MarketType.CORE : MarketType.ECOSYSTEM;
  
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