import { NextResponse } from "next/server";

const key = JSON.parse(process.env.BITTE_KEY || "{}");
const bitteConfig = JSON.parse(process.env.BITTE_CONFIG || "{}");
if (!key?.accountId) {
  console.error("no account");
}

const url = bitteConfig.url || "https://near-cow-agent.vercel.app";

export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "Bitte CoWSwap and BENQI Agent",
      description: "API for interactions with CoW Protocol and BENQI protocols on Avalanche",
      version: "1.0.0",
    },
    servers: [{ url }],
    "x-mb": {
      "account-id": key.accountId,
      assistant: {
        name: "CoWSwap and BENQI Assistant",
        description:
          "An assistant that generates EVM transaction data for CoW Protocol and BENQI protocol interactions",
        instructions: `
        This assistant facilitates EVM transaction encoding as signature requests, exclusively for EVM-compatible networks. It adheres to the following strict protocol:
NETWORKS:
- ONLY supports Ethereum (chainId: 1), Gnosis (chainId: 100), Arbitrum (chainId: 42161), Base (chainId: 8453), Avalanche (chainId: 43114), and Avalanche Fuji Testnet (chainId: 43113)
- NEVER claims to support any other networks
- ALWAYS requires explicit chainId specification from the user
- NEVER infers chainId values
TOKEN HANDLING:
- For native assets (ETH, xDAI, POL, BNB, AVAX): ALWAYS uses 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE as the sellToken address
- ALWAYS passes token symbols for sellToken and buyToken unless specific addresses are provided
- NEVER infers token decimals under any circumstance
- ALWAYS uses Token Units for sellAmountBeforeFee
TRANSACTION PROCESSING:
- ALWAYS passes the transaction fields to generate-evm-tx tool for signing
- ALWAYS displays meta content to user after signing
- ALWAYS passes evmAddress as the safeAddress for any request requiring safeAddress
- ALWAYS uses balance, weth, erc20, and benqi endpoints only on supported networks
BENQI OPERATIONS:
- ONLY uses BENQI operations on Avalanche (43114) and Avalanche Fuji Testnet (43113)
- For liquid staking, ALWAYS informs users that unstaking has a 15-day unlock period
- For markets operations, ALWAYS validates that users can only borrow USDC from Ecosystem Markets
- ALWAYS checks health factors for users before recommending borrowing operations
AUTHENTICATION:
- REQUIRES if user doesn't say what network they want require them to provide a chain ID otherwise just assume the network they asked for,
- VALIDATES network compatibility before proceeding
- CONFIRMS token details explicitly before executing transactions
This assistant follows these specifications with zero deviation to ensure secure, predictable transaction handling. `,
        tools: [{ type: "generate-evm-tx" }],
        image: `${url}/cowswap.svg`,
        categories: ["defi"],
        chainIds: [1, 100, 8453, 42161, 11155111, 43114, 43113],
      },
      image: `${url}/cowswap.svg`,
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
      "/api/tools/cowswap": {
        post: {
          tags: ["cowswap"],
          operationId: "swap",
          summary:
            "Quote a price and fee for the specified order parameters. Posts unsigned order to CoW and returns Signable payload",
          description:
            "Given a partial order compute the minimum fee and a price estimate for the order. Return a full order that can be used directly for signing, and with an included signature, passed directly to the order creation endpoint.",
          parameters: [
            { $ref: "#/components/parameters/chainId" },
            { $ref: "#/components/parameters/safeAddress" },
            {
              in: "query",
              name: "sellToken",
              required: true,
              schema: {
                type: "string",
              },
              description:
                "The ERC-20 token symbol or address to be sold, if provided with the symbol do not try to infer the address.",
            },
            {
              in: "query",
              name: "buyToken",
              required: true,
              schema: {
                type: "string",
              },
              description:
                "The ERC-20 token symbol or address to be bought, if provided with the symbol do not try to infer the address..",
            },
            {
              in: "query",
              name: "receiver",
              required: false,
              schema: {
                type: "string",
              },
              description:
                "The address to receive the proceeds of the trade, instead of the sender's address.",
            },
            {
              in: "query",
              name: "sellAmountBeforeFee",
              required: true,
              schema: {
                type: "string",
              },
              description:
                "The amount of tokens to sell before fees, represented as a decimal string in token units. Not Atoms.",
            },
          ],
          // requestBody: {
          //   description: "The order parameters to compute a quote for.",
          //   required: true,
          //   content: {
          //     "application/json": {
          //       schema: {
          //         $ref: "#/components/schemas/OrderQuoteRequest",
          //       },
          //     },
          //   },
          // },
          responses: {
            "200": { $ref: "#/components/responses/SignRequestResponse200" },
            "400": {
              description: "Error quoting order.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PriceEstimationError",
                  },
                },
              },
            },
            "404": {
              description: "No route was found for the specified order.",
            },
            "429": {
              description: "Too many order quotes.",
            },
            "500": {
              description: "Unexpected error quoting an order.",
            },
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
          example: 100,
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
            "The ERC-20 token symbol or address to be sold, if provided with the symbol do not try to infer the address.",
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
            "Cowswap order response including transaction and order URL",
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
                      orderUrl: "https://explorer.cow.fi/orders/0x123...",
                      message: "Order submitted successfully",
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
              example: 100,
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
        },
        AppData: {
          description:
            "The string encoding of a JSON object representing some `appData`. The format of the JSON expected in the `appData` field is defined [here](https://github.com/cowprotocol/app-data).",
          type: "string",
          example: '{"version":"0.9.0","metadata":{}}',
        },
        AppDataHash: {
          description:
            "32 bytes encoded as hex with `0x` prefix. It's expected to be the hash of the stringified JSON object representing the `appData`.",
          type: "string",
        },
        SellTokenSource: {
          description: "Where should the `sellToken` be drawn from?",
          type: "string",
          enum: ["erc20", "internal", "external"],
        },
        BuyTokenDestination: {
          description: "Where should the `buyToken` be transferred to?",
          type: "string",
          enum: ["erc20", "internal"],
        },
        PriceQuality: {
          description:
            "How good should the price estimate be?\n\nFast: The price estimate is chosen among the fastest N price estimates.\nOptimal: The price estimate is chosen among all price estimates.\nVerified: The price estimate is chosen among all verified/simulated price estimates.\n\n**NOTE**: Orders are supposed to be created from `verified` or `optimal` price estimates.",
          type: "string",
          enum: ["fast", "optimal", "verified"],
        },
        SigningScheme: {
          description: "How was the order signed?",
          type: "string",
          enum: ["eip712", "ethsign", "presign", "eip1271"],
        },
        EcdsaSigningScheme: {
          description: "How was the order signed?",
          type: "string",
          enum: ["eip712", "ethsign"],
        },
        Signature: {
          description: "A signature.",
          oneOf: [
            { $ref: "#/components/schemas/EcdsaSignature" },
            { $ref: "#/components/schemas/PreSignature" },
          ],
        },
        EcdsaSignature: {
          description:
            "65 bytes encoded as hex with `0x` prefix. `r || s || v` from the spec.",
          type: "string",
          example:
            "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        },
        PreSignature: {
          description: 'Empty signature bytes. Used for "presign" signatures.',
          type: "string",
          example: "0x",
        },
        OrderQuoteRequest: {
          description: "Request fee and price quote.",
          allOf: [
            { $ref: "#/components/schemas/OrderQuoteSide" },
            { $ref: "#/components/schemas/OrderQuoteValidity" },
            {
              type: "object",
              properties: {
                sellToken: {
                  description: "ERC-20 token to be sold",
                  allOf: [{ $ref: "#/components/schemas/Address" }],
                },
                buyToken: {
                  description: "ERC-20 token to be bought",
                  allOf: [{ $ref: "#/components/schemas/Address" }],
                },
                receiver: {
                  description:
                    "An optional address to receive the proceeds of the trade instead of the `owner` (i.e. the order signer).",
                  allOf: [{ $ref: "#/components/schemas/Address" }],
                  nullable: true,
                },
                appData: {
                  description:
                    "AppData which will be assigned to the order. Expects either a string JSON doc as defined on [AppData](https://github.com/cowprotocol/app-data) or a hex encoded string for backwards compatibility. When the first format is used, it's possible to provide the derived appDataHash field.",
                  oneOf: [
                    { $ref: "#/components/schemas/AppData" },
                    { $ref: "#/components/schemas/AppDataHash" },
                  ],
                },
                appDataHash: {
                  description:
                    "The hash of the stringified JSON appData doc. If present, `appData` field must be set with the aforementioned data where this hash is derived from. In case they differ, the call will fail.",
                  anyOf: [{ $ref: "#/components/schemas/AppDataHash" }],
                },
                sellTokenBalance: {
                  allOf: [{ $ref: "#/components/schemas/SellTokenSource" }],
                  default: "erc20",
                },
                buyTokenBalance: {
                  allOf: [{ $ref: "#/components/schemas/BuyTokenDestination" }],
                  default: "erc20",
                },
                from: { $ref: "#/components/schemas/Address" },
                priceQuality: {
                  allOf: [{ $ref: "#/components/schemas/PriceQuality" }],
                  default: "verified",
                },
                signingScheme: {
                  allOf: [{ $ref: "#/components/schemas/SigningScheme" }],
                  default: "eip712",
                },
                onchainOrder: {
                  description:
                    "Flag to signal whether the order is intended for on-chain order placement. Only valid for non ECDSA-signed orders.",
                  default: false,
                },
                network: {
                  description:
                    "The network on which the order is to be placed.",
                  type: "string",
                  enum: ["mainnet", "xdai", "arbitrum_one"],
                },
              },
              required: ["sellToken", "buyToken", "from"],
            },
          ],
        },
        OrderQuoteResponse: {
          description:
            "An order quoted by the backend that can be directly signed and submitted to the order creation backend.",
          type: "object",
          properties: {
            quote: { $ref: "#/components/schemas/OrderParameters" },
            from: { $ref: "#/components/schemas/Address" },
            expiration: {
              description:
                "Expiration date of the offered fee. Order service might not accept the fee after this expiration date. Encoded as ISO 8601 UTC.",
              type: "string",
              example: "1985-03-10T18:35:18.814523Z",
            },
            id: {
              description:
                "Quote ID linked to a quote to enable providing more metadata when analysing order slippage.",
              type: "integer",
            },
            verified: {
              description:
                "Whether it was possible to verify that the quoted amounts are accurate using a simulation.",
              type: "boolean",
            },
          },
          required: ["quote", "expiration", "verified"],
        },
        PriceEstimationError: {
          type: "object",
          properties: {
            errorType: {
              type: "string",
              enum: [
                "QuoteNotVerified",
                "UnsupportedToken",
                "ZeroAmount",
                "UnsupportedOrderType",
              ],
            },
            description: { type: "string" },
          },
          required: ["errorType", "description"],
        },
        OrderKind: {
          description: "Is this order a buy or sell?",
          type: "string",
          enum: ["buy", "sell"],
        },
        OrderParameters: {
          description: "Order parameters.",
          type: "object",
          properties: {
            sellToken: {
              description: "ERC-20 token to be sold.",
              allOf: [{ $ref: "#/components/schemas/Address" }],
            },
            buyToken: {
              description: "ERC-20 token to be bought.",
              allOf: [{ $ref: "#/components/schemas/Address" }],
            },
            receiver: {
              description:
                "An optional Ethereum address to receive the proceeds of the trade instead of the owner (i.e. the order signer).",
              allOf: [{ $ref: "#/components/schemas/Address" }],
              nullable: true,
            },
            sellAmount: {
              description: "Amount of `sellToken` to be sold in atoms.",
              allOf: [{ $ref: "#/components/schemas/TokenAmount" }],
            },
            buyAmount: {
              description: "Amount of `buyToken` to be bought in atoms.",
              allOf: [{ $ref: "#/components/schemas/TokenAmount" }],
            },
            validTo: {
              description:
                "Unix timestamp (`uint32`) until which the order is valid.",
              type: "integer",
            },
            appData: {
              $ref: "#/components/schemas/AppDataHash",
            },
            feeAmount: {
              description: "feeRatio * sellAmount + minimal_fee in atoms.",
              allOf: [{ $ref: "#/components/schemas/TokenAmount" }],
            },
            kind: {
              description: "The kind is either a buy or sell order.",
              allOf: [{ $ref: "#/components/schemas/OrderKind" }],
            },
            partiallyFillable: {
              description: "Is the order fill-or-kill or partially fillable?",
              type: "boolean",
            },
            sellTokenBalance: {
              allOf: [{ $ref: "#/components/schemas/SellTokenSource" }],
              default: "erc20",
            },
            buyTokenBalance: {
              allOf: [{ $ref: "#/components/schemas/BuyTokenDestination" }],
              default: "erc20",
            },
            signingScheme: {
              allOf: [{ $ref: "#/components/schemas/SigningScheme" }],
              default: "eip712",
            },
          },
          required: [
            "sellToken",
            "buyToken",
            "sellAmount",
            "buyAmount",
            "validTo",
            "appData",
            "feeAmount",
            "kind",
            "partiallyFillable",
          ],
        },
        OrderQuoteSide: {
          description: "The buy or sell side when quoting an order.",
          oneOf: [
            {
              type: "object",
              description:
                "Quote a sell order given the final total `sellAmount` including fees.",
              properties: {
                kind: {
                  allOf: [
                    {
                      $ref: "#/components/schemas/OrderQuoteSideKindSell",
                    },
                  ],
                },
                sellAmountBeforeFee: {
                  description:
                    "The total amount that is available for the order. From this value, the fee is deducted and the buy amount is calculated.",
                  allOf: [
                    {
                      $ref: "#/components/schemas/TokenAmount",
                    },
                  ],
                },
              },
              required: ["kind", "sellAmountBeforeFee"],
            },
            {
              type: "object",
              description: "Quote a sell order given the `sellAmount`.",
              properties: {
                kind: {
                  allOf: [
                    {
                      $ref: "#/components/schemas/OrderQuoteSideKindSell",
                    },
                  ],
                },
                sellAmountAfterFee: {
                  description: "The `sellAmount` for the order.",
                  allOf: [
                    {
                      $ref: "#/components/schemas/TokenAmount",
                    },
                  ],
                },
              },
              required: ["kind", "sellAmountAfterFee"],
            },
            {
              type: "object",
              description: "Quote a buy order given an exact `buyAmount`.",
              properties: {
                kind: {
                  allOf: [
                    {
                      $ref: "#/components/schemas/OrderQuoteSideKindBuy",
                    },
                  ],
                },
                buyAmountAfterFee: {
                  description: "The `buyAmount` for the order.",
                  allOf: [
                    {
                      $ref: "#/components/schemas/TokenAmount",
                    },
                  ],
                },
              },
              required: ["kind", "buyAmountAfterFee"],
            },
          ],
        },
        OrderQuoteSideKindSell: {
          type: "string",
          enum: ["sell"],
        },
        OrderQuoteSideKindBuy: {
          type: "string",
          enum: ["buy"],
        },
        TokenAmount: {
          description: "Amount of a token. `uint256` encoded in decimal.",
          type: "string",
          example: "1234567890",
        },
        OrderQuoteValidity: {
          description: "The validity for the order.",
          oneOf: [
            {
              type: "object",
              description: "Absolute validity.",
              properties: {
                validTo: {
                  description:
                    "Unix timestamp (`uint32`) until which the order is valid.",
                  type: "integer",
                },
              },
            },
            {
              type: "object",
              description: "Relative validity",
              properties: {
                validFor: {
                  description:
                    "Number (`uint32`) of seconds that the order should be valid for.",
                  type: "integer",
                },
              },
            },
          ],
        },
      },
    },
    "x-readme": {
      "explorer-enabled": true,
      "proxy-enabled": true,
    },
  };

  return NextResponse.json(pluginData);
}
