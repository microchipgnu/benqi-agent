import { Address, getAddress } from "viem";

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
  // Fuji testnet
  43113: {
    liquidStaking: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE" as Address, // Update with actual testnet address
    savaxToken: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE" as Address, // Update with actual testnet address
    marketsCore: "0x64478Bf5B8e2EE74a3430A4D6846Cdd0F2A4d1DD" as Address, // Testnet Core Markets address
    marketsEcosystem: "0x08Cb31026155BC7E44210Fc05CF13DE6eF03FCb6" as Address, // Testnet Ecosystem Markets address
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
  
  // For Compound-style lending, we need to call the qiToken contract for the specific asset
  // Function selector for "mint(address,uint256)" in BENQI
  const mintFunctionSelector = "0x4b8a3529";
  
  // Encode parameters: token address (32 bytes) + amount (32 bytes)
  const encodedToken = tokenAddress.slice(2).toLowerCase().padStart(64, "0");
  const encodedAmount = amount.toString(16).padStart(64, "0");
  
  return {
    to: marketContract,
    data: `${mintFunctionSelector}${encodedToken}${encodedAmount}`,
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
  
  // For Compound-style lending, we need to call the specific function for borrowing the asset
  // Function selector for "borrow(address,uint256)" in BENQI
  const borrowFunctionSelector = "0xda3d454c";
  
  // Encode parameters: token address (32 bytes) + amount (32 bytes)
  const encodedToken = tokenAddress.slice(2).toLowerCase().padStart(64, "0");
  const encodedAmount = amount.toString(16).padStart(64, "0");
  
  return {
    to: marketContract,
    data: `${borrowFunctionSelector}${encodedToken}${encodedAmount}`,
    value: "0x0",
  };
}

// Helper for common operations across BENQI endpoints
export function getBenqiContract(chainId: number, contractType: keyof typeof BENQI_CONTRACTS[43114]): Address {
  if (!BENQI_CONTRACTS[chainId]) {
    throw new Error(`Chain ID ${chainId} not supported for BENQI operations`);
  }
  
  const address = BENQI_CONTRACTS[chainId][contractType];
  return address; // Return the address directly, as we will checksum it in the health route
} 