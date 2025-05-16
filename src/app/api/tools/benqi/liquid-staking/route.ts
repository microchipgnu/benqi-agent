import {
  floatField,
  handleRequest,
  signRequestFor,
  validateInput,
  type FieldParser,
  type TxData
} from "@bitte-ai/agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import { parseUnits } from "viem";
import { getSavaxToAvaxRate, stakeAvaxTransaction, unstakeSavaxTransaction } from "../util";
  
const chainId = 43114;

interface StakeInput {
  amount: number; // AVAX amount in token units (e.g., 1.5 AVAX)
  action: string; // "stake" or "unstake"
}

const fieldParsers: FieldParser<StakeInput> = {
  amount: floatField,
  action: (param: string | null, name: string): string => {
    if (!param) {
      throw new Error(`${name} is required`);
    }
    const action = param.toLowerCase();
    if (action !== "stake" && action !== "unstake" && action !== "withdraw") {
      throw new Error(`${name} must be either "stake" or "unstake" or "withdraw"`);
    }
    return action;
  }
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

// Handler for both staking AVAX to get sAVAX and unstaking sAVAX to get AVAX
export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log("benqi/liquid-staking GET request", req.url);
  return handleRequest(req, liquidStakingLogic, (result) => NextResponse.json(result));
}

async function liquidStakingLogic(req: NextRequest): Promise<TxData | { message: string } | undefined> {
  const url = new URL(req.url);
  const search = url.searchParams;
  console.log("benqi/liquid-staking params:", Object.fromEntries(search.entries()));
  
  const { amount, action } = validateInput<StakeInput>(search, fieldParsers);

  // Ensure chainId is supported
  if (chainId !== 43114) {
    throw new Error(`ChainId ${chainId} not supported for BENQI Liquid Staking. Supported chains: Avalanche (43114)`);
  }
  
  // Convert amount to wei (decimal places for AVAX/sAVAX is 18)
  const amountInWei = parseUnits(amount.toString(), 18);
  
  // Get current exchange rate for informational purposes
  const exchangeRate = await getSavaxToAvaxRate();
  
  if (action === "stake") {
    // Staking AVAX to get sAVAX
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
  } else if (action === "unstake") {
    // Unstaking sAVAX to get AVAX
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
  } else if (action === "withdraw") {

    return {
      message: `Visit https://app.benqi.fi/savax to withdraw your sAVAX to your wallet`
    }
    
  }

}