import { NextRequest, NextResponse } from "next/server";

const key = JSON.parse(process.env.BITTE_KEY || "{}");
if (!key?.accountId) {
  console.error("no account");
}

const url = process.env.VERCEL_URL || "https://benqi-agent.vercel.app";

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

export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "Bitte BENQI Agent",
      description: "API for interactions with BENQI protocols on Avalanche",
      version: "1.0.0",
    },
    servers: [{ url }],
    "x-mb": {
      "account-id": key.accountId,
      assistant: {
        name: "BENQI Assistant",
        description:
          "An assistant that generates EVM transaction data for BENQI protocol interactions",
        instructions: `
        This assistant facilitates EVM transaction encoding as signature requests for BENQI protocols on Avalanche networks. It adheres to the following strict protocol:
NETWORKS:
- ONLY supports Avalanche (chainId: 43114) and Avalanche Fuji Testnet (chainId: 43113)
- NEVER claims to support any other networks
- ALWAYS requires explicit chainId specification from the user
- NEVER infers chainId values
TOKEN HANDLING:
- For native AVAX: ALWAYS uses 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE as the token address
- ALWAYS passes token symbols unless specific addresses are provided
- NEVER infers token decimals under any circumstance
TRANSACTION PROCESSING:
- ALWAYS passes the transaction fields to generate-evm-tx tool for signing
- ALWAYS displays meta content to user after signing
- ALWAYS passes evmAddress as the safeAddress for any request requiring safeAddress
- ALWAYS uses balance, erc20, and benqi endpoints only on supported networks
BENQI OPERATIONS:
- For liquid staking, ALWAYS informs users that unstaking has a 15-day unlock period
- For markets operations, ALWAYS validates that users can only borrow USDC from Ecosystem Markets
- ALWAYS checks health factors for users before recommending borrowing operations
AUTHENTICATION:
- REQUIRES if user doesn't say what network they want require them to provide a chain ID otherwise just assume the network they asked for,
- VALIDATES network compatibility before proceeding
- CONFIRMS token details explicitly before executing transactions
This assistant follows these specifications with zero deviation to ensure secure, predictable transaction handling. `,
        tools: [{ type: "generate-evm-tx" }],
        image: `${url}/benqi-logo.jpg`,
        categories: ["defi"],
        chainIds: [43114, 43113],
      },
      image: `${url}/benqi-logo.jpg`,
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["health"],
          summary: "Confirms server running",
          description: "Test Endpoint to confirm system is running",
          operationId: "check-health",
          parameters: [],
          responses: {
            "200": {
              description: "Ok Message",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        description: "Ok Message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/balances": {
        get: {
          tags: ["balances"],
          summary: "Get Token Balances",
          description: "Returns token balances for the connected wallet",
          operationId: "get-balances",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            { $ref: "#/components/parameters/safeAddress" },
          ],
          responses: {
            "200": {
              description: "List of token balances",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        token: {
                          $ref: "#/components/schemas/Address",
                        },
                        balance: {
                          type: "string",
                          description: "Token balance in smallest units (wei)",
                          example: "1000000000000000000",
                        },
                        symbol: {
                          type: "string",
                          description: "Token symbol",
                          example: "USDC",
                        },
                        decimals: {
                          type: "number",
                          description: "Token decimals",
                          example: 18,
                        },
                        logoUri: {
                          type: "string",
                          description: "Token logo URI",
                          example: "https://example.com/token-logo.png",
                        },
                      },
                      required: ["token", "balance", "symbol", "decimals"],
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
      },
      "/api/tools/erc20": {
        get: {
          tags: ["erc20"],
          summary: "Encodes ERC20 (Fungible) Token Transfer",
          description: "Encodes ERC20 transfer transaction as MetaTransaction",
          operationId: "erc20-transfer",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            { $ref: "#/components/parameters/amount" },
            { $ref: "#/components/parameters/recipient" },
            { $ref: "#/components/parameters/tokenOrSymbol" },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SignRequest200" },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
      },
      "/api/tools/benqi/liquid-staking": {
        get: {
          tags: ["benqi"],
          summary: "Stake AVAX for sAVAX",
          description: "Stake AVAX tokens to receive sAVAX through BENQI Liquid Staking",
          operationId: "stake-avax",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            {
              in: "query",
              name: "amount",
              required: true,
              schema: {
                type: "number",
              },
              description: "Amount of AVAX to stake in AVAX units (e.g., 1.5 AVAX)",
            },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SignRequestResponse200" },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
        post: {
          tags: ["benqi"],
          summary: "Unstake sAVAX for AVAX",
          description: "Unstake sAVAX tokens to receive AVAX through BENQI Liquid Staking. Note: Unstaking has a 15-day unlock period.",
          operationId: "unstake-savax",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            {
              in: "query",
              name: "amount",
              required: true,
              schema: {
                type: "number",
              },
              description: "Amount of sAVAX to unstake in sAVAX units (e.g., 1.5 sAVAX)",
            },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SignRequestResponse200" },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
      },
      "/api/tools/benqi/markets": {
        get: {
          tags: ["benqi"],
          summary: "Deposit assets to BENQI Markets",
          description: "Supply assets to BENQI Markets as deposits or collateral",
          operationId: "deposit-to-markets",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            { $ref: "#/components/parameters/amount" },
            { $ref: "#/components/parameters/tokenOrSymbol" },
            {
              in: "query",
              name: "marketType",
              required: true,
              schema: {
                type: "string",
                enum: ["core", "ecosystem"],
              },
              description: "Type of market: 'core' for highly liquid assets or 'ecosystem' for isolated markets",
            },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SignRequestResponse200" },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
        post: {
          tags: ["benqi"],
          summary: "Borrow assets from BENQI Markets",
          description: "Borrow assets from BENQI Markets using deposited collateral. Note: Only USDC can be borrowed from Ecosystem Markets.",
          operationId: "borrow-from-markets",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            { $ref: "#/components/parameters/amount" },
            { $ref: "#/components/parameters/tokenOrSymbol" },
            {
              in: "query",
              name: "marketType",
              required: true,
              schema: {
                type: "string",
                enum: ["core", "ecosystem"],
              },
              description: "Type of market: 'core' for highly liquid assets or 'ecosystem' for isolated markets (ecosystem only allows USDC borrowing)",
            },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SignRequestResponse200" },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
      },
      "/api/tools/benqi/health": {
        get: {
          tags: ["benqi"],
          summary: "Check account health in BENQI Markets",
          description: "Get the health factor and liquidation risk status for an account in BENQI Markets",
          operationId: "check-account-health",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            {
              in: "query",
              name: "accountAddress",
              required: true,
              schema: {
                $ref: "#/components/schemas/Address",
              },
              description: "Address of the account to check health for",
            },
            {
              in: "query",
              name: "marketType",
              required: true,
              schema: {
                type: "string",
                enum: ["core", "ecosystem"],
              },
              description: "Type of market to check: 'core' or 'ecosystem'",
            },
          ],
          responses: {
            "200": {
              description: "Account health information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      healthFactor: {
                        type: "number",
                        description: "Health factor of the account (below 1 is liquidatable)",
                      },
                      totalCollateralValue: {
                        type: "string",
                        description: "Total value of collateral in USD",
                      },
                      totalBorrowValue: {
                        type: "string",
                        description: "Total value of borrowed assets in USD",
                      },
                      liquidationThreshold: {
                        type: "number",
                        description: "Threshold at which liquidation occurs",
                      },
                      status: {
                        type: "string",
                        enum: ["safe", "warning", "danger", "liquidatable"],
                        description: "Current status of the account's health",
                      },
                      positions: {
                        type: "object",
                        properties: {
                          supplied: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                token: {
                                  type: "string",
                                  description: "Token address",
                                },
                                symbol: {
                                  type: "string",
                                  description: "Token symbol",
                                },
                                amount: {
                                  type: "string",
                                  description: "Amount supplied",
                                },
                                value: {
                                  type: "string",
                                  description: "USD value of supplied amount",
                                },
                                collateralFactor: {
                                  type: "number",
                                  description: "Collateral factor for this asset",
                                },
                                isCollateral: {
                                  type: "boolean",
                                  description: "Whether this asset is being used as collateral",
                                },
                              },
                            },
                          },
                          borrowed: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                token: {
                                  type: "string",
                                  description: "Token address",
                                },
                                symbol: {
                                  type: "string",
                                  description: "Token symbol",
                                },
                                amount: {
                                  type: "string",
                                  description: "Amount borrowed",
                                },
                                value: {
                                  type: "string",
                                  description: "USD value of borrowed amount",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest400" },
          },
        },
      },
    },
    components: {
      parameters: {
        chainId: {
          name: "chainId",
          in: "query",
          description:
            "EVM Network on which to assests live and transactions are to be constructed",
          required: true,
          schema: {
            type: "number",
          },
          example: 43114,
        },
        amount: {
          name: "amount",
          in: "query",
          description: "amount in Units",
          required: true,
          schema: {
            type: "number",
          },
          example: 0.123,
        },
        address: {
          name: "address",
          in: "query",
          description:
            "20 byte Ethereum address encoded as a hex with `0x` prefix.",
          required: true,
          schema: {
            type: "string",
          },
          example: "0x6810e776880c02933d47db1b9fc05908e5386b96",
        },
        safeAddress: {
          name: "safeAddress",
          in: "query",
          required: true,
          description: "The Safe address (i.e. the connected user address)",
          schema: {
            $ref: "#/components/schemas/Address",
          },
        },
        recipient: {
          name: "recipient",
          in: "query",
          required: true,
          description: "Recipient address of the transferred token.",
          schema: {
            $ref: "#/components/schemas/Address",
          },
        },
        token: {
          name: "token",
          in: "query",
          description: "Token address to be transferred.",
          schema: {
            $ref: "#/components/schemas/Address",
          },
        },
        tokenOrSymbol: {
          name: "tokenOrSymbol",
          in: "query",
          description:
            "The ERC-20 token symbol or address to be used.",
          schema: {
            type: "string",
          },
        },
      },
      responses: {
        SignRequest200: {
          description:
            "Generic Structure representing an EVM Signature Request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SignRequest",
              },
            },
          },
        },
        SignRequestResponse200: {
          description:
            "Transaction response including transaction and additional metadata",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  transaction: {
                    $ref: "#/components/schemas/SignRequest",
                  },
                  meta: {
                    type: "object",
                    description:
                      "Additional metadata related to the transaction",
                    additionalProperties: true,
                    example: {
                      message: "Transaction submitted successfully",
                    },
                  },
                },
                required: ["transaction"],
              },
            },
          },
        },
        BadRequest400: {
          description: "Bad Request - Invalid or missing parameters",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  ok: {
                    type: "boolean",
                    example: false,
                  },
                  message: {
                    type: "string",
                    example: "Missing required parameters: chainId or amount",
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        Address: {
          description:
            "20 byte Ethereum address encoded as a hex with `0x` prefix.",
          type: "string",
          example: "0x6810e776880c02933d47db1b9fc05908e5386b96",
        },
        SignRequest: {
          type: "object",
          required: ["method", "chainId", "params"],
          properties: {
            method: {
              type: "string",
              enum: [
                "eth_sign",
                "personal_sign",
                "eth_sendTransaction",
                "eth_signTypedData",
                "eth_signTypedData_v4",
              ],
              description: "The signing method to be used.",
              example: "eth_sendTransaction",
            },
            chainId: {
              type: "integer",
              description:
                "The ID of the Ethereum chain where the transaction or signing is taking place.",
              example: 43114,
            },
            params: {
              oneOf: [
                {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/MetaTransaction",
                  },
                  description: "An array of Ethereum transaction parameters.",
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Parameters for personal_sign request",
                  example: [
                    "0x4578616d706c65206d657373616765",
                    "0x0000000000000000000000000000000000000001",
                  ],
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Parameters for eth_sign request",
                  example: [
                    "0x0000000000000000000000000000000000000001",
                    "0x4578616d706c65206d657373616765",
                  ],
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description:
                    "Parameters for signing structured data (TypedDataParams)",
                  example: [
                    "0x0000000000000000000000000000000000000001",
                    '{"data": {"types": {"EIP712Domain": [{"name": "name","type": "string"}]}}}',
                  ],
                },
              ],
            },
          },
        },
        MetaTransaction: {
          description: "Sufficient data representing an EVM transaction",
          type: "object",
          properties: {
            to: {
              $ref: "#/components/schemas/Address",
              description: "Recipient address",
            },
            data: {
              type: "string",
              description: "Transaction calldata",
              example: "0xd0e30db0",
            },
            value: {
              type: "string",
              description: "Transaction value",
              example: "0x1b4fbd92b5f8000",
            },
          },
          required: ["to", "data", "value"],
        }
      },
    },
    "x-readme": {
      "explorer-enabled": true,
      "proxy-enabled": true,
    },
  };

  return NextResponse.json(pluginData);
}
