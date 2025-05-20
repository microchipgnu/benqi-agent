import { BENQI_SAVAX_ABI } from "@/src/abi";
import { Address, encodeFunctionData } from "viem";

// Type for our contracts mapping
type ChainContracts = {
  [chainId: number]: {
    liquidStaking: Address;
    savaxToken: Address;
    marketsCore: Address;
    marketsEcosystem: Address;
  };
};

// BENQI contract addresses
const BENQI_CONTRACTS: ChainContracts = {
  // Main Avalanche network
  43114: {
    liquidStaking: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE" as Address,
    savaxToken: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE" as Address, // Same as liquid staking contract
    marketsCore: "0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4" as Address, // BENQI Core Markets Unitroller
    marketsEcosystem: "0x3344e55C6DDE2A01F4ED893f97bAc1c99F5f217B" as Address, // BENQI Ecosystem Markets Unitroller
  },
};

// Add BENQI token contract addresses
const BENQI_TOKEN_CONTRACTS: {[chainId: number]: {[symbol: string]: Address}} = {
  43114: {
    'AVAX': '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c' as Address, // qiAVAX token contract
    // Add other token contracts as needed
  }
};

// Add BENQI market token contract addresses
const BENQI_MARKET_CONTRACTS: {[chainId: number]: {[token: string]: Address}} = {
  43114: {
    'USDCn': '0xB715808a78F6041E46d61Cb123C9B4A27056AE9C' as Address,
    // Add other market contracts as needed
  }
};

// Market types
export enum MarketType {
  CORE = "core",
  ECOSYSTEM = "ecosystem",
}

// Define MetaTransaction type to match what's expected
type MetaTransaction = {
  to: Address;
  data: string;
  value: string;
};

// Function to create a stake AVAX transaction
export function stakeAvaxTransaction(
  amount: bigint,
  chainId: number = 43114
): MetaTransaction {
  return {
    to: BENQI_CONTRACTS[chainId].liquidStaking,
    data: "0x", // Empty data for native AVAX transfers
    value: amount.toString(),
  };
}

// Function to create an unstake sAVAX transaction
export function unstakeSavaxTransaction(
  amount: bigint,
  chainId: number = 43114,
): MetaTransaction {
  const data = encodeFunctionData({
    abi: BENQI_SAVAX_ABI,
    functionName: 'requestUnlock',
    args: [amount]
  })
  
  return {
    to: BENQI_CONTRACTS[chainId].liquidStaking,
    data: data,
    value: "0x0",
  };
}

// Function to get sAVAX to AVAX exchange rate
// This would normally involve an actual contract call or API request
export async function getSavaxToAvaxRate(): Promise<number> {
  // Mocked implementation - in production, this should call the actual contract or API
  return 1.07; // Example rate: 1 sAVAX = 1.07 AVAX
}

// Function to create a deposit (supply) transaction for BENQI Markets
export function depositToMarketsTransaction(
  tokenAddress: Address,
  amount: bigint,
  marketType: MarketType,
  chainId: number = 43114,
  tokenSymbol?: string
): MetaTransaction {
  // Handle native AVAX deposits differently
  const isNativeAVAX = tokenSymbol === 'AVAX' || tokenAddress.toLowerCase() === '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'.toLowerCase(); // WAVAX address
  
  if (isNativeAVAX) {
    // For native AVAX, we interact directly with qiAVAX token contract
    const qiAvaxContract = BENQI_TOKEN_CONTRACTS[chainId]['AVAX'];
    
    // Use mint() function without parameters for native AVAX
    const mintFunctionSelector = "0x1249c58b";
    
    return {
      to: qiAvaxContract,
      data: mintFunctionSelector, // No parameters needed
      value: amount.toString(), // Send AVAX with the transaction
    };
  } else {
    // For ERC-20 tokens, use the markets contract
    const marketContract = marketType === MarketType.CORE 
      ? BENQI_CONTRACTS[chainId].marketsCore 
      : BENQI_CONTRACTS[chainId].marketsEcosystem;
    
    // For Compound-style lending, we need to call the mint/supply function
    // Function selector for mint/supply in BENQI
    const mintFunctionSelector = "0xa0712d68"; // This is the correct selector for mint/supply
    
    // Encode parameters: token address (32 bytes) + amount (32 bytes)
    const encodedToken = tokenAddress.slice(2).toLowerCase().padStart(64, "0");
    const encodedAmount = amount.toString(16).padStart(64, "0");
    
    return {
      to: marketContract,
      data: `${mintFunctionSelector}${encodedToken}${encodedAmount}`,
      value: "0x0",
    };
  }
}

// Function to create a borrow transaction for BENQI Markets
export function borrowFromMarketsTransaction(
  tokenAddress: Address,
  amount: bigint,
  marketType: MarketType,
  chainId: number = 43114,
  tokenSymbol?: string
): MetaTransaction {
  // If we have a known market contract for this token, use it directly
  if (tokenSymbol && BENQI_MARKET_CONTRACTS[chainId]?.[tokenSymbol]) {
    // Direct interaction with the token market contract
    const marketContract = BENQI_MARKET_CONTRACTS[chainId][tokenSymbol];
    
    // Function selector for borrow in BENQI token markets
    const borrowFunctionSelector = "0xc5ebeaec"; // borrow(uint256 borrowAmount)
    
    // Encode only the amount parameter (32 bytes)
    const encodedAmount = amount.toString(16).padStart(64, "0");
    
    return {
      to: marketContract,
      data: `${borrowFunctionSelector}${encodedAmount}`,
      value: "0x0",
    };
  } else {
    // Fallback to the controller approach for unknown tokens
    // Get the appropriate market controller based on market type
    const marketController = marketType === MarketType.CORE 
      ? BENQI_CONTRACTS[chainId].marketsCore 
      : BENQI_CONTRACTS[chainId].marketsEcosystem;
    
    // Function selector for borrowing through controller
    const borrowFunctionSelector = "0x4b8a3529";
    
    // Encode parameters: token address (32 bytes) + amount (32 bytes)
    const encodedToken = tokenAddress.slice(2).toLowerCase().padStart(64, "0");
    const encodedAmount = amount.toString(16).padStart(64, "0");
    
    return {
      to: marketController,
      data: `${borrowFunctionSelector}${encodedToken}${encodedAmount}`,
      value: "0x0",
    };
  }
}

// Helper for common operations across BENQI endpoints
export function getBenqiContract(chainId: number, contractType: keyof typeof BENQI_CONTRACTS[43114]): Address {
  if (!BENQI_CONTRACTS[chainId]) {
    throw new Error(`Chain ID ${chainId} not supported for BENQI operations`);
  }
  
  const address = BENQI_CONTRACTS[chainId][contractType];
  return address; // Return the address directly, as we will checksum it in the health route
} 