import { parseUnits, type Address } from "viem";
import {
  addressField,
  floatField,
  numberField,
  validateInput,
  type FieldParser,
  signRequestFor,
  handleRequest,
  type TxData,
} from "@bitte-ai/agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import { stakeAvaxTransaction, unstakeSavaxTransaction, getSavaxToAvaxRate } from "../util";

interface StakeInput {
  chainId: number;
  amount: number; // AVAX amount in token units (e.g., 1.5 AVAX)
}

interface UnstakeInput {
  chainId: number;
  amount: number; // sAVAX amount in token units
}

const stakeFieldParsers: FieldParser<StakeInput> = {
  chainId: numberField,
  amount: floatField,
};

const unstakeFieldParsers: FieldParser<UnstakeInput> = {
  chainId: numberField,
  amount: floatField,
};

// Handler for staking AVAX to get sAVAX
export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleRequest(req, stakeLogic, (result) => NextResponse.json(result));
}

// Handler for unstaking sAVAX to get AVAX
export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleRequest(req, unstakeLogic, (result) => NextResponse.json(result));
}

async function stakeLogic(req: NextRequest): Promise<TxData> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/liquid-staking/stake", search);
  
  const { chainId, amount } = validateInput<StakeInput>(search, stakeFieldParsers);
  
  // Ensure chainId is supported
  if (chainId !== 43114 && chainId !== 43113) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Liquid Staking. Supported chains: Avalanche (43114) and Fuji Testnet (43113)`);
  }
  
  // Convert AVAX amount to wei (decimal places for AVAX is 18)
  const amountInWei = parseUnits(amount.toString(), 18);
  
  // Get current exchange rate for informational purposes
  const exchangeRate = await getSavaxToAvaxRate();
  const expectedSavaxAmount = amount / exchangeRate;
  
  console.log(`Staking ${amount} AVAX for approximately ${expectedSavaxAmount} sAVAX at rate ${exchangeRate}`);
  
  return {
    transaction: signRequestFor({
      chainId,
      metaTransactions: [
        stakeAvaxTransaction(amountInWei, chainId)
      ],
    }),
    meta: {
      expectedSavaxAmount: expectedSavaxAmount.toFixed(6),
      exchangeRate: exchangeRate.toFixed(6),
      message: `Staking ${amount} AVAX for approximately ${expectedSavaxAmount.toFixed(6)} sAVAX`
    }
  };
}

async function unstakeLogic(req: NextRequest): Promise<TxData> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/liquid-staking/unstake", search);
  
  const { chainId, amount } = validateInput<UnstakeInput>(search, unstakeFieldParsers);
  
  // Ensure chainId is supported
  if (chainId !== 43114 && chainId !== 43113) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Liquid Staking. Supported chains: Avalanche (43114) and Fuji Testnet (43113)`);
  }
  
  // Convert sAVAX amount to wei (decimal places for sAVAX is 18)
  const amountInWei = parseUnits(amount.toString(), 18);
  
  // Get current exchange rate for informational purposes
  const exchangeRate = await getSavaxToAvaxRate();
  const expectedAvaxAmount = amount * exchangeRate;
  
  console.log(`Unstaking ${amount} sAVAX for approximately ${expectedAvaxAmount} AVAX at rate ${exchangeRate}`);
  
  return {
    transaction: signRequestFor({
      chainId,
      metaTransactions: [
        unstakeSavaxTransaction(amountInWei, chainId)
      ],
    }),
    meta: {
      expectedAvaxAmount: expectedAvaxAmount.toFixed(6),
      exchangeRate: exchangeRate.toFixed(6),
      message: `Unstaking ${amount} sAVAX for approximately ${expectedAvaxAmount.toFixed(6)} AVAX. Note: Actual AVAX will be available after a 15-day unlock period.`
    }
  };
} 