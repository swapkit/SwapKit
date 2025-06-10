# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- Build: `bun build` (clean build: `bun build:clean`)
- Lint: `bun lint` (lint specific file: `bun biome check --write path/to/file.ts`)
- Type check: `bun type-check:ci`
- Test: `bun test` (with coverage: `bun test:coverage`)
- Test specific file: `bun test path/to/test.ts`
- Run playground: `bun playground:bun-react`, `bun playground:next`, or `bun playground:vite`

## Code Style Guidelines
- Use Biome for formatting (spaces, 2-space indent, 100 char line width)
- Imports: organized automatically with Biome
- Semicolons: always required
- Types: strict TypeScript (noImplicitAny, strictNullChecks, etc.)
- Naming: follow existing patterns in codebase
- Error handling: prefer explicit error handling
- No default exports (except for components)
- ESM modules with explicit extensions in imports
- Avoid console.log (use info/warn/error when necessary)
- Use `bun` as the package manager

## High-Level Architecture
SwapKit v4 is a modular blockchain integration SDK with the following package hierarchy:

### 1. @swapkit/helpers (Foundation Layer)
- Core types and utilities used across all packages
- `AssetValue` class for unified asset amount handling
- API clients: 1inch, CoinGecko, THORNode, MayaNode, etc.
- Token registries and lists
- Common enums: `Chain`, `FeeOption`, `SwapKitError`
- Memo generation for cross-chain transactions

### 2. @swapkit/core (Orchestration Layer)
- `SwapKitCore` class - central client coordinating all functionality
- Wallet connection and management
- Plugin system for extensibility
- Chain connectivity orchestration
- Transaction building and broadcasting
- Quote aggregation from multiple providers
- Event system for state updates

### 3. @swapkit/toolboxes (Blockchain Layer)
- Chain-specific implementations for 15+ blockchains
- **UTXO**: Bitcoin, Litecoin, Dogecoin, Bitcoin Cash
- **EVM**: Ethereum, Arbitrum, Avalanche, BSC, Optimism, Polygon
- **Cosmos**: Cosmos Hub, Kujira, THORChain, Maya
- **Others**: Solana, Radix, Substrate (Polkadot, Chainflip)
- Each provides: address validation, tx building, balance fetching, fee estimation

### 4. @swapkit/plugins (Provider Layer)
- Swap provider integrations:
  - **THORChain/Maya**: Cross-chain DEX aggregation
  - **Chainflip**: Cross-chain swaps via state chain
  - **1inch**: EVM DEX aggregation
  - **Kado**: Fiat on/off ramp
  - **Direct swaps**: EVM, Solana, Radix native swaps
- Each plugin handles quote fetching and swap execution

### 5. @swapkit/wallets (Wallet Layer)
- 20+ wallet integrations:
  - **Hardware**: Ledger, Trezor, KeepKey
  - **Extensions**: MetaMask, Phantom, Keplr, OKX, Coinbase, etc.
  - **Mobile**: WalletConnect
  - **Software**: Keystore (encrypted), XDEFI, Exodus
- Unified interface for connection, signing, and address management

### 6. @swapkit/sdk (Bundle Layer)
- Pre-configured bundle with all wallets and plugins
- `createSwapKit()` function for easy initialization
- Exports all functionality from other packages

### 7. @swapkit/ui (Interface Layer)
- React components for rapid integration
- `SwapKitWidget`: Complete swap interface
- `SwapKitProvider`: React context provider
- `ConnectButton`, `AssetInput`: Wallet and asset UI components

### Development Workflow
- Branch from `develop` for contributions
- Create changesets for version updates: `bun changeset`
- Bootstrap project: `bun bootstrap`
- Packages use workspace protocol: `workspace:*`
- Tools directory contains build and TypeScript configs as submodules

### Release Process
- Automated via changesets and GitHub Actions
- All releases are made from `develop` branch
- Changesets with tags are used to track versions

## Code Style Guidelines

- **TypeScript Return Types**: Let TypeScript infer return types instead of explicitly declaring them. TypeScript's type inference is powerful and will correctly determine return types in most cases.
  ```typescript
  // ✅ GOOD - Let TypeScript infer the return type
  function getAddress() {
    return signer ? signer.getAddress() : undefined;
  }
  
  // ❌ AVOID - Explicit return type is unnecessary
  function getAddress(): Promise<string> | undefined {
    return signer ? signer.getAddress() : undefined;
  }
  ```

## Common Development Commands

### Package Management
```bash
# Install dependencies
bun install

# Clean and reinstall dependencies
bun clean

# Update dependencies interactively
bun deps
```

### Building
```bash
# Build all packages
bun build

# Clean build (remove existing build artifacts first)
bun build:clean

# Build with debug logging
bun build:debug

# Build for CI (without eliding lines)
bun build:ci
```

### Testing
```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests for CI
bun test:ci
```

### Type Checking
```bash
# Type check all packages
bun type-check

# Type check for CI
bun type-check:ci

# Type check Go-related code
bun type-check:go
```

### Linting
```bash
# Lint and automatically fix issues
bun lint

# Lint workspace structure
bun lint:ws
```

### Playgrounds
```bash
# Run Bun + React playground
bun playground:bun-react

# Run Next.js playground
bun playground:next

# Run Vite playground
bun playground:vite
```

### Documentation
```bash
# Run documentation site
bun docs
```

### Token Generation
```bash
# Generate token information
bun generate:tokens
```

## Version Management

SwapKit uses Changesets for version management:

```bash
# Generate version change
bun changeset

# Version bump
bun version-bump

# Publish packages
bun publish-packages
```

## Git Hooks

The repository uses Lefthook for git hooks:
- Pre-commit hooks run linting and type checking
- Lint runs Biome for formatting and code quality checks

## Implementation Approaches

There are two main ways to use SwapKit:

1. **SwapKit SDK**: The all-in-one solution that bundles Core with all available plugins and wallet integrations.
   ```typescript
   import { createSwapKit } from '@swapkit/sdk';
   const swapKit = createSwapKit();
   ```

2. **SwapKit Core**: The modular approach where you only include the components you need.
   ```typescript
   import { SwapKit } from '@swapkit/core';
   import { ThorchainPlugin } from '@swapkit/plugins/thorchain';
   import { keystoreWallet } from '@swapkit/wallets/keystore';
   
   const swapKit = SwapKit({
     plugins: { ...ThorchainPlugin },
     wallets: { ...keystoreWallet },
   });
   ```

## Supported Chains

The SDK supports multiple blockchain networks, each with its own toolbox:
- EVM chains: Ethereum, BSC, Arbitrum, Avalanche, Polygon, Optimism, Base
- UTXO chains: Bitcoin, BitcoinCash, Litecoin, Dogecoin, Dash, Zcash
- Cosmos chains: Cosmos Hub, THORChain, Maya, Kujira
- Other chains: Solana, Polkadot, Radix, Ripple, Near

## Toolbox Implementation Guidelines

When implementing a new chain toolbox, follow these established patterns and interfaces to ensure consistency across the SwapKit ecosystem.

### Core Interface Requirements

Every toolbox must implement these essential methods:

```typescript
interface CoreToolbox {
  // Address Management
  getAddress(): Promise<string> | string;
  validateAddress(address: string): boolean;
  
  // Balance Operations
  getBalance(address: string): Promise<AssetValue[]>;
  
  // Transaction Operations
  transfer(params: ChainTransferParams): Promise<string>;
  createTransaction?(params: ChainTransferParams): Promise<ChainTransaction>;
  estimateTransactionFee?(params: ChainTransferParams): Promise<AssetValue>;
  signTransaction?(tx: ChainTransaction): Promise<string>;
  broadcastTransaction?(signedTx: string): Promise<string>;
  
  // Optional Utility Methods
  signMessage?(message: string): Promise<string>;
  createKeysForPath?(params: DerivationParams): Promise<ChainKeys>;
  getPrivateKeyFromMnemonic?(params: DerivationParams): string;
}
```

### Constructor Patterns

Toolboxes should support these initialization patterns:

```typescript
// Pattern 1: With external signer
function getChainToolbox(chain: Chain, options: { signer: ChainSigner })

// Pattern 2: With mnemonic phrase
function getChainToolbox(chain: Chain, options: { 
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
})

// Pattern 3: Provider-only (read-only operations)
function getChainToolbox(chain: Chain, options?: {})
```

**Note**: RPC URLs, node URLs, and API keys should NEVER be passed as constructor parameters. All configuration must be retrieved from SKConfig to ensure consistency across the application.

### Parameter Type Standards

Use these standardized parameter types:

```typescript
interface ChainTransferParams {
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
  feeOptionKey?: FeeOption;
  // Chain-specific optional fields
}

interface DerivationParams {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}
```

### Error Handling Conventions

- Use `SwapKitError` with specific error codes
- Common error patterns:
  ```typescript
  throw new SwapKitError("toolbox_[chain]_no_signer");
  throw new SwapKitError("toolbox_[chain]_invalid_address");
  throw new SwapKitError("toolbox_[chain]_insufficient_balance");
  ```

### Provider/Connection Patterns

Each toolbox should abstract the blockchain connection:

```typescript
// EVM Pattern
{ provider: Provider | BrowserProvider, signer?: Signer }

// UTXO Pattern  
{ api: ChainAPI, signer?: UTXOSigner }

// Cosmos Pattern
{ client: StargateClient, signer?: OfflineSigner }

// Custom RPC Pattern
{ rpcUrl: string, signer?: CustomSigner }
```

### Validation Implementation

Implement chain-specific address validation:

```typescript
function validateAddress(address: string): boolean {
  try {
    // Chain-specific validation logic
    // Examples:
    // - EVM: ethers.getAddress(address)
    // - Bitcoin: bitcoin.address.validate(address)
    // - Cosmos: bech32.decode(address) with prefix check
    return true;
  } catch {
    return false;
  }
}
```

### Fee Estimation Patterns

Implement consistent fee estimation:

```typescript
async function estimateTransactionFee(params: ChainTransferParams): Promise<AssetValue> {
  // Calculate base fee for transaction type
  // Apply fee option multiplier (Average=1x, Fast=1.5x, Fastest=2x)
  // Return as AssetValue in chain's gas asset
}
```

### Transaction Lifecycle

Follow this transaction lifecycle pattern:

1. **Validation**: Validate inputs (addresses, amounts, signer availability)
2. **Preparation**: Build transaction object with all required fields
3. **Fee Estimation**: Calculate and apply appropriate fees
4. **Signing**: Sign transaction if signer is available
5. **Broadcasting**: Submit to network and return transaction hash

### Type Safety Requirements

- Create chain-specific type definitions
- Use discriminated unions for parameter variations
- Export all public types from toolbox module
- Implement generic constraints where appropriate

### File Structure Convention

```
packages/toolboxes/src/[chain]/
├── index.ts           # Main exports
├── toolbox.ts         # Core toolbox implementation  
├── types.ts           # Chain-specific types
├── helpers/           # Utility functions
│   ├── api.ts         # API/RPC helpers
│   ├── validation.ts  # Address/input validation
│   └── transaction.ts # Transaction building
└── test/              # Unit tests
```

### Testing Requirements

Every toolbox should include:
- Unit tests for all public methods
- Address validation test cases
- Transaction building test cases
- Error handling test cases
- Integration tests with test networks

### Chain-Specific Extensions

Toolboxes may include chain-specific methods:

```typescript
// EVM: Token operations
approve(params: ApproveParams): Promise<string>;
allowance(params: AllowanceParams): Promise<bigint>;

// Cosmos: Staking operations  
delegate(params: DelegateParams): Promise<string>;
undelegate(params: UndelegateParams): Promise<string>;

// Substrate: Governance operations
vote(params: VoteParams): Promise<string>;
```

### Integration Points

Ensure toolbox integrates with:
- SwapKit Core plugin system
- Wallet adapter interfaces  
- Chain-specific middleware
- Error reporting system
- Fee estimation services

## SwapKit Configuration (SKConfig)

SwapKit uses a centralized configuration store (`SKConfig`) to manage RPC URLs, API keys, and integration settings across all toolboxes. Understanding and properly utilizing SKConfig is essential when implementing or using toolboxes.

**IMPORTANT**: All RPC URLs, node URLs, API keys, and other configuration values MUST be accessed exclusively through SKConfig. Never hardcode these values or bypass the configuration system. This ensures consistency, allows runtime configuration updates, and enables proper environment switching.

### Configuration Structure

SKConfig manages the following configuration categories:

```typescript
{
  // RPC URLs for all chains
  rpcUrls: { [Chain]: string },
  
  // Node URLs for THORChain/Maya
  nodeUrls: { [Chain]: string },
  
  // Explorer URLs for blockchain explorers
  explorerUrls: { [Chain]: string },
  
  // API Keys for various services
  apiKeys: {
    blockchair: string,      // UTXO chain APIs
    keepKey: string,         // KeepKey hardware wallet
    swapKit: string,         // SwapKit API authentication
    walletConnectProjectId: string  // WalletConnect v2
  },
  
  // Environment settings
  envs: {
    apiUrl: string,          // SwapKit API URL
    devApiUrl: string,       // Development API URL
    isDev: boolean,          // Development mode flag
    isStagenet: boolean      // Stagenet/testnet flag
  },
  
  // Integration configurations
  integrations: {
    radix: { ... },          // Radix dApp configuration
    chainflip: { ... },      // Chainflip broker settings
    coinbase: { ... },       // Coinbase wallet settings
    trezor: { ... },         // Trezor hardware wallet
    keepKey: { ... }         // KeepKey hardware wallet
  },
  
  // Custom API implementations
  apis: { [Chain]: CustomAPI }
}
```

### Toolbox Usage Patterns

#### 1. Retrieving RPC URLs

All toolboxes follow this pattern to get chain-specific RPC URLs:

```typescript
// EVM chains
const rpcUrl = SKConfig.get("rpcUrls")[chain];
const provider = new JsonRpcProvider(rpcUrl);

// Cosmos chains
const rpcUrl = SKConfig.get("rpcUrls")[chain];
const client = await createStargateClient(rpcUrl);

// Substrate chains
const rpcUrl = SKConfig.get("rpcUrls")[chain];
const provider = new WsProvider(rpcUrl);
```

#### 2. Using API Keys

Toolboxes check for and use API keys when available:

```typescript
// UTXO chains with Blockchair
const apiKey = SKConfig.get("apiKeys").blockchair || "";
if (!apiKey) {
  warnOnce(true, "No Blockchair API key found. Functionality will be limited.");
}

// SwapKit API requests
const { swapKit } = SKConfig.get("apiKeys");
const headers = swapKit ? { "x-api-key": swapKit } : {};
```

#### 3. Environment-Specific Configuration

```typescript
// Check if using stagenet/testnet
const { isStagenet } = SKConfig.get("envs");
const prefix = isStagenet ? "stagenet-" : "";

// Use appropriate API URL
const { apiUrl, devApiUrl, isDev } = SKConfig.get("envs");
const baseUrl = isDev ? devApiUrl : apiUrl;
```

#### 4. Custom API Implementation

Toolboxes support custom API implementations:

```typescript
// Check for custom API first
const customApi = SKConfig.get("apis")[chain];
if (customApi) {
  warnOnce(true, `Using custom ${chain} API. Be sure to implement all methods.`);
  return customApi;
}

// Otherwise use default implementation
return getDefaultApiImplementation(chain);
```

### Configuration Best Practices

#### 1. Initial Configuration

Configure SwapKit at application startup:

```typescript
import { SwapKit } from '@swapkit/core';
import { SKConfig } from '@swapkit/helpers';

// Option 1: Configure via SwapKit initialization
const swapKit = SwapKit({
  config: {
    rpcUrls: {
      [Chain.Ethereum]: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
      [Chain.Avalanche]: "https://api.avax.network/ext/bc/C/rpc"
    },
    apiKeys: {
      blockchair: "YOUR_BLOCKCHAIR_KEY",
      swapKit: "YOUR_SWAPKIT_KEY"
    }
  }
});

// Option 2: Configure directly via SKConfig
SKConfig.set({
  rpcUrls: { ... },
  apiKeys: { ... }
});
```

#### 2. Runtime Configuration Updates

Update configuration dynamically:

```typescript
// Update specific RPC URL
SKConfig.setRpcUrl(Chain.Ethereum, "https://new-rpc-url.com");

// Update API key
SKConfig.setApiKey("blockchair", "NEW_API_KEY");

// Update environment settings
SKConfig.setEnv("isStagenet", true);

// Update integration config
SKConfig.setIntegrationConfig("radix", {
  dAppDefinitionAddress: "account_rdx...",
  applicationName: "My dApp",
  applicationVersion: "1.0.0",
  network: { networkId: 1, networkName: "mainnet" }
});
```

#### 3. Toolbox Implementation Requirements

When implementing a new toolbox, ensure you:

1. **ALWAYS use SKConfig for configuration values**:
   ```typescript
   // ✅ CORRECT - Use SKConfig
   const rpcUrl = SKConfig.get("rpcUrls")[chain];
   const nodeUrl = SKConfig.get("nodeUrls")[chain];
   const apiKey = SKConfig.get("apiKeys").blockchair;
   
   // ❌ WRONG - Never hardcode values
   const rpcUrl = "https://eth-mainnet.g.alchemy.com/v2/abc123";
   const apiKey = "my-hardcoded-api-key";
   ```

2. **Check for custom APIs**:
   ```typescript
   const customApi = SKConfig.get("apis")[chain];
   if (customApi) return customApi;
   ```

3. **Respect environment flags**:
   ```typescript
   const { isStagenet } = SKConfig.get("envs");
   ```

4. **Use appropriate API keys**:
   ```typescript
   const apiKey = SKConfig.get("apiKeys").yourService;
   ```

5. **Never bypass SKConfig**:
   - Do not accept RPC URLs as direct parameters in toolbox constructors
   - Do not store configuration values in local variables or constants
   - Always retrieve fresh values from SKConfig when needed

### Default RPC URLs

SwapKit provides default RPC URLs for all supported chains. These can be overridden via configuration:

- **EVM Chains**: Public RPC endpoints (recommend using your own for production)
- **Cosmos Chains**: Official chain RPC endpoints
- **UTXO Chains**: Blockchair API (requires API key for full functionality)
- **Other Chains**: Chain-specific public endpoints

### Integration Configurations

#### Radix Configuration
Required for Radix wallet connections:
```typescript
{
  dAppDefinitionAddress: string,  // Your dApp's on-ledger definition
  applicationName: string,        // Display name
  applicationVersion: string,     // Version string
  network: {
    networkId: number,           // 1 for mainnet, 2 for testnet
    networkName: string,         // "mainnet" or "testnet"
    dashboardBase: string        // Explorer URL
  }
}
```

#### Chainflip Configuration
For using Chainflip's broker API:
```typescript
{
  useSDKBroker?: boolean,        // Use SDK broker instead of direct API
  brokerUrl: string              // Broker endpoint URL
}
```
