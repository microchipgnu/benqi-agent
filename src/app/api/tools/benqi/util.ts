import { Address, parseUnits } from "viem";
import {
  signRequestFor,
  type TxData,
} from "@bitte-ai/agent-sdk";

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
    marketsCore: "0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C" as Address, // Example - replace with actual address
    marketsEcosystem: "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5" as Address, // Example - replace with actual address
  },
  // Fuji testnet
  43113: {
    liquidStaking: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE" as Address, // Using mainnet for example, should be updated
    savaxToken: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE" as Address,
    marketsCore: "0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C" as Address, 
    marketsEcosystem: "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5" as Address,
  },
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
  chainId: number = 43114
): MetaTransaction {
  // Mocked unstake function signature (should be replaced with actual function)
  const unstakeFunc = "0x1e9a6950"; // This is a placeholder and needs to be replaced with actual function selector
  const encodedAmount = amount.toString().padStart(64, "0");
  
  return {
    to: BENQI_CONTRACTS[chainId].liquidStaking,
    data: `${unstakeFunc}${encodedAmount}`,
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
  chainId: number = 43114
): MetaTransaction {
  // Get the appropriate market contract based on market type
  const marketContract = marketType === MarketType.CORE 
    ? BENQI_CONTRACTS[chainId].marketsCore 
    : BENQI_CONTRACTS[chainId].marketsEcosystem;
  
  // Mock function signature for deposit (supply)
  // In a real implementation, this would be the actual ERC20 approve + deposit function calls
  const depositFunc = "0x6e553f65"; // Placeholder function selector
  
  // Encode parameters: token address (32 bytes) + amount (32 bytes)
  const encodedToken = tokenAddress.slice(2).padStart(64, "0");
  const encodedAmount = amount.toString(16).padStart(64, "0");
  
  return {
    to: marketContract,
    data: `${depositFunc}${encodedToken}${encodedAmount}`,
    value: "0x0",
  };
}

// Function to create a borrow transaction for BENQI Markets
export function borrowFromMarketsTransaction(
  tokenAddress: Address,
  amount: bigint,
  marketType: MarketType,
  chainId: number = 43114
): MetaTransaction {
  // Get the appropriate market contract based on market type
  const marketContract = marketType === MarketType.CORE 
    ? BENQI_CONTRACTS[chainId].marketsCore 
    : BENQI_CONTRACTS[chainId].marketsEcosystem;
  
  // Mock function signature for borrow
  const borrowFunc = "0xc5ebeaec"; // Placeholder function selector
  
  // Encode parameters: token address (32 bytes) + amount (32 bytes)
  const encodedToken = tokenAddress.slice(2).padStart(64, "0");
  const encodedAmount = amount.toString(16).padStart(64, "0");
  
  return {
    to: marketContract,
    data: `${borrowFunc}${encodedToken}${encodedAmount}`,
    value: "0x0",
  };
}

// Helper for common operations across BENQI endpoints
export function getBenqiContract(chainId: number, contractType: keyof typeof BENQI_CONTRACTS[43114]): Address {
  if (!BENQI_CONTRACTS[chainId]) {
    throw new Error(`Chain ID ${chainId} not supported for BENQI operations`);
  }
  
  return BENQI_CONTRACTS[chainId][contractType];
} 