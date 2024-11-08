import { Address } from "viem";

interface TokenBalance {
  tokenAddress: string | null; // null for native token
  token: {
    name: string;
    symbol: string;
    decimals: number;
    logoUri: string;
  };
  balance: string;
  fiatBalance: string;
  fiatConversion: string;
}

const SAFE_NETWORKS: { [chainId: number]: string } = {
  1: "mainnet",
  10: "optimism",
  56: "binance",
  100: "gnosis-chain",
  137: "polygon",
  8453: "base",
  42161: "arbitrum",
  11155111: "sepolia",
};

export function safeTxServiceUrlFor(chainId: number): string | undefined {
  const network = SAFE_NETWORKS[chainId];
  if (!network) {
    console.warn(`Unsupported Safe Transaction Service chainId=${chainId}`);
    return undefined;
  }
  return `https://safe-transaction-${network}.safe.global`;
}

export type TokenBalanceMap = { [symbol: string]: TokenBalance };

export async function getSafeBalances(
  chainId: number,
  address: Address,
): Promise<TokenBalance[]> {
  const baseUrl = safeTxServiceUrlFor(chainId);
  if (!baseUrl) {
    throw new Error(
      `Chain ID ${chainId} not supported by Safe Transaction Service`,
    );
  }
  const trusted = chainId === 11155111 ? false : true;
  const exclude_spam = chainId === 11155111 ? false : true;
  const url = `${baseUrl}/api/v1/safes/${address}/balances/?trusted=${trusted}&exclude_spam=${exclude_spam}`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Safe balances:", error);
    throw error;
  }
}

export function balancesMap(balances: TokenBalance[]): TokenBalanceMap {
  return balances.reduce((acc, balance) => {
    acc[balance.token.symbol] = balance;
    return acc;
  }, {} as TokenBalanceMap);
}
