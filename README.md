# BENQI AI Agent

This is a [Next.js](https://nextjs.org) project that implements an AI-powered agent for interacting with BENQI protocols on Avalanche. The agent helps users generate and execute transactions for BENQI liquid staking, markets, and other services.

## Features

- BENQI Liquid Staking: Stake AVAX for sAVAX
- BENQI Markets: Deposit and borrow assets
- Health Monitoring: Check account health and liquidation risk
- ERC20 token transfers
- Support for Avalanche and Avalanche Fuji Testnet

## API Endpoints

The agent exposes several endpoints:

- `/api/tools/benqi/liquid-staking`: Stake AVAX for sAVAX and unstake sAVAX to AVAX
- `/api/tools/benqi/markets`: Deposit to and borrow from BENQI markets
- `/api/tools/benqi/health`: Check account health and liquidation risk
- `/api/tools/erc20`: Generate ERC20 transfer transactions
- `/api/tools/balances`: Get token balances for a wallet

## Local Development

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun dev
bun dev-testnet
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the Swagger UI.

## Environment Setup

The application requires the following environment variables:

- `BITTE_KEY`: JSON containing the account ID
- `TOKEN_MAP_URL`: URL for loading token mappings
- `ZERION_KEY`: API key for Zerion for fetching balances

## Learn More

To learn more about the technologies used in this project:

- [BENQI Documentation](https://docs.benqi.fi/) - Learn about BENQI protocols
- [Bitte Documentation](https://docs.bitte.ai/) - Learn about Bitte and building AI agents
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.