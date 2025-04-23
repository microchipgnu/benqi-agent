import { Address } from "viem";
import {
  addressField,
  numberField,
  validateInput,
  type FieldParser,
  handleRequest,
} from "@bitte-ai/agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getBenqiContract, MarketType } from "../util";

// Interface for health check input
interface HealthCheckInput {
  chainId: number;
  accountAddress: Address;
  marketType: string; // "core" or "ecosystem"
}

// Response interface for health data
interface HealthCheckResponse {
  healthFactor: number;
  totalCollateralValue: string;
  totalBorrowValue: string;
  liquidationThreshold: number;
  status: "safe" | "warning" | "danger" | "liquidatable";
  positions: {
    supplied: Array<{
      token: string;
      symbol: string;
      amount: string;
      value: string;
      collateralFactor: number;
      isCollateral: boolean;
    }>;
    borrowed: Array<{
      token: string;
      symbol: string;
      amount: string;
      value: string;
    }>;
  };
}

// Field parsers for health check
const healthCheckParsers: FieldParser<HealthCheckInput> = {
  chainId: numberField,
  accountAddress: addressField,
  marketType: (param: string | null) => {
    if (!param || (param !== "core" && param !== "ecosystem")) {
      throw new Error('marketType must be either "core" or "ecosystem"');
    }
    return param;
  },
};

// GET endpoint for health check
export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleRequest(req, healthCheckLogic, (result) => NextResponse.json(result));
}

// Logic for health check operation
async function healthCheckLogic(req: NextRequest): Promise<HealthCheckResponse> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/health/check", search);
  
  const { chainId, accountAddress, marketType } = validateInput<HealthCheckInput>(search, healthCheckParsers);
  
  // Ensure chainId is supported
  if (chainId !== 43114 && chainId !== 43113) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Markets. Supported chains: Avalanche (43114) and Fuji Testnet (43113)`);
  }
  
  // In a real implementation, this would make calls to the BENQI contracts
  // to retrieve the actual health data for the account
  
  // This is a mock implementation for demonstration purposes
  const mockHealthData: HealthCheckResponse = {
    healthFactor: 1.8, // Above 1 is safe, below 1 is liquidatable
    totalCollateralValue: "5000", // In USD
    totalBorrowValue: "2750", // In USD
    liquidationThreshold: 1.0, // When health factor falls below this, liquidation can occur
    status: "warning", // One of: "safe", "warning", "danger", "liquidatable"
    positions: {
      supplied: [
        {
          token: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          symbol: "USDC",
          amount: "2500",
          value: "2500", // USD value
          collateralFactor: 0.8, // 80% LTV
          isCollateral: true,
        },
        {
          token: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE", // sAVAX
          symbol: "sAVAX",
          amount: "20",
          value: "2500", // USD value if 1 sAVAX = $125
          collateralFactor: 0.7, // 70% LTV
          isCollateral: true,
        },
      ],
      borrowed: [
        {
          token: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // USDT
          symbol: "USDT",
          amount: "1500",
          value: "1500", // USD value
        },
        {
          token: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", // WETH
          symbol: "WETH",
          amount: "0.75",
          value: "1250", // USD value if 1 WETH = $1666
        },
      ],
    },
  };
  
  // Calculate real health factor
  // Health Factor = Total Collateral Value * Liquidation Threshold / Total Borrow Value
  // For demonstration, we already set the mock health factor
  
  // Set status based on health factor
  if (mockHealthData.healthFactor >= 2.0) {
    mockHealthData.status = "safe";
  } else if (mockHealthData.healthFactor >= 1.5) {
    mockHealthData.status = "warning";
  } else if (mockHealthData.healthFactor >= 1.0) {
    mockHealthData.status = "danger";
  } else {
    mockHealthData.status = "liquidatable";
  }
  
  return mockHealthData;
} 