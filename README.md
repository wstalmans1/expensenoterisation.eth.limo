# Expense Notarisation DApp

Register expenses on-chain and view past records.

UI: `https://expensenoterisation.eth.limo/`

**Requirements**
- Node.js >= 18
- pnpm >= 8

**Quickstart**
1. `pnpm install`
2. Create the contracts env file:
- `cp packages/contracts/.env.example packages/contracts/.env`
- Set `SEPOLIA_URL` and `PRIVATE_KEY`.
3. Create the frontend env file:
- `cp apps/frontend/.env.example apps/frontend/.env.local`
- Set `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_ALCHEMY_API_KEY`, `VITE_APP_CHAIN_ID`, and the deployed contract addresses.
4. Start the frontend:
- `pnpm dev`

**Contracts**
- Compile: `pnpm compile`
- Deploy to Sepolia: `pnpm deploy:sepolia`
- Deploy to local Hardhat network: `pnpm deploy:local`

The deploy script writes:
- Contract ABI to `apps/frontend/src/contracts/ExpenseRegistry.json`.
- Deployment metadata to `packages/contracts/deployments/<network>.json`.

Use the proxy address in the frontend:
- `VITE_EXPENSE_REGISTRY_ADDRESS` should be the proxy address.
- `VITE_EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS` is optional and used for display.

**Frontend**
- Dev server: `pnpm dev`
- Production build: `pnpm build`
- Preview build: `pnpm preview`

**Contract Notes**
- `addExpense(date, amount, description)` stores expenses per user.
- `date` is a Unix timestamp in seconds.
- `amount` is a `uint256` integer. If you need decimals, scale the value in the UI (for example, store cents).

**Project Structure**
- `apps/frontend`: Vite + React frontend with Wagmi/RainbowKit.
- `packages/contracts`: Hardhat project with `ExpenseRegistry` UUPS upgradeable contract.
- `docs/setup_guides`: Setup and scaffolding guides used for this project.
