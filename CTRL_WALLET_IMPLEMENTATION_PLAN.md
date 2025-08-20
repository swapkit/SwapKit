# CTRL Wallet Signing Implementation Plan

## Executive Summary

The CTRL wallet presents unique challenges for implementing standardized `sign` and `signAndBroadcast` methods. Unlike traditional wallets that expose signing capabilities, CTRL uses a high-level transaction API that abstracts signing details. This plan outlines strategies to work within CTRL's constraints while providing a consistent interface.

## Current CTRL Implementation Analysis

### Chain Support Overview

| Chain Type | Current Implementation | Signing Method |
|------------|----------------------|----------------|
| **UTXO** (BTC, LTC, DOGE, BCH) | `walletTransfer` API | No direct signing exposed |
| **EVM** (ETH, BSC, AVAX, etc.) | Standard signer via provider | `signer.signTransaction` available |
| **Solana** | Standard toolbox with provider | `signTransaction` available |
| **Cosmos** (ATOM, KUJI, NOBLE) | Offline signer | Standard signing available |
| **THORChain/Maya** | Custom `walletTransfer` | No direct signing |
| **Near** | Custom transaction API | `signAndSendTransaction` only |

### Key Findings

1. **UTXO Chains Limitation**: CTRL does not expose PSBT signing for UTXO chains. It only provides:
   - `walletTransfer`: High-level transfer method
   - `deposit`: Special method for THORChain/Maya deposits
   - No access to raw signing capabilities

2. **EVM Chains**: Full signing support through ethers.js signer
   - Can implement standard `signTransaction`
   - Can implement `signAndBroadcastTransaction`

3. **Solana**: Full signing support through provider
   - Already has `signTransaction` 
   - Can add unified `signAndBroadcastTransaction`

4. **Cosmos Chains**: Standard signing through offline signer
   - Can implement standard signing methods

## Implementation Strategy

### Approach 1: Hybrid Implementation (Recommended)

Create a wrapper that provides the best available functionality for each chain:

```typescript
interface CtrlSigningCapabilities {
  // Unified interface - same method names across all chains
  
  // UTXO - Will throw error directing to use transfer method
  sign?: (transaction: Psbt) => Promise<Psbt>;
  signAndBroadcast?: (transaction: Psbt) => Promise<string>;
  
  // EVM - Full signing support
  sign?: (tx: EVMTxParams) => Promise<string>;
  signAndBroadcast?: (tx: EVMTxParams) => Promise<string>;
  
  // Solana - Full signing support  
  sign?: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signAndBroadcast?: (tx: Transaction | VersionedTransaction) => Promise<string>;
  
  // CTRL-specific transfer fallback for UTXO
  transfer?: (params: UTXOTransferParams) => Promise<string>;
}
```

### Approach 2: Request CTRL API Enhancement

Work with CTRL team to expose:
1. PSBT signing endpoint for UTXO chains
2. Raw transaction signing for Near
3. Separate sign and broadcast methods

### Approach 3: Transaction Builder Pattern

For chains without signing access, implement a transaction builder that:
1. Builds unsigned transactions
2. Returns transaction objects for CTRL to process
3. Uses CTRL's transfer API as the execution mechanism

## Detailed Implementation Plan

### Phase 1: Document Current Capabilities

Create clear documentation of what's possible with CTRL:

```typescript
// packages/wallets/src/ctrl/capabilities.ts
export const CTRL_CAPABILITIES = {
  bitcoin: {
    sign: false,
    signAndBroadcast: false,
    transfer: true,
    buildTransaction: true,
  },
  ethereum: {
    sign: true,
    signAndBroadcast: true,
    transfer: true,
    buildTransaction: true,
  },
  solana: {
    sign: true,
    signAndBroadcast: true,
    transfer: true,
    buildTransaction: true,
  },
  // ... other chains
};
```

### Phase 2: Implement Available Signing Methods

#### 2.1 EVM Implementation
```typescript
// packages/wallets/src/ctrl/evm-signing.ts
export async function getEVMSigningMethods(provider: BrowserProvider, chain: EVMChain) {
  const signer = await provider.getSigner();
  
  return {
    sign: async (tx: EVMTxParams): Promise<string> => {
      // Remove send, just sign
      const signedTx = await signer.signTransaction(tx);
      return signedTx;
    },
    
    signAndBroadcast: async (tx: EVMTxParams): Promise<string> => {
      const response = await signer.sendTransaction(tx);
      return response.hash;
    },
  };
}
```

#### 2.2 Solana Implementation
```typescript
// packages/wallets/src/ctrl/solana-signing.ts
export function getSolanaSigningMethods(provider: SolanaProvider) {
  return {
    sign: async (transaction: Transaction | VersionedTransaction) => {
      return provider.signTransaction(transaction);
    },
    
    signAndBroadcast: async (transaction: Transaction | VersionedTransaction) => {
      const signed = await provider.signTransaction(transaction);
      const connection = await getConnection();
      const signature = await connection.sendRawTransaction(signed.serialize());
      return signature;
    },
  };
}
```

#### 2.3 UTXO Workaround Implementation
```typescript
// packages/wallets/src/ctrl/utxo-builder.ts
export function getUTXOBuilderMethods(chain: UTXOChain) {
  return {
    // Can build but not sign PSBTs
    buildPSBT: async (params: UTXOBuildTxParams): Promise<Psbt> => {
      const { createTransaction } = await getUtxoToolbox(chain);
      const { psbt } = await createTransaction(params);
      return psbt;
    },
    
    // Use CTRL's transfer API directly
    transfer: async (params: UTXOTransferParams): Promise<string> => {
      return walletTransfer(params);
    },
    
    // Throw informative error for signing attempts
    sign: async (): Promise<never> => {
      throw new SwapKitError("wallet_ctrl_psbt_signing_not_supported", {
        solution: "Use transfer method instead or contact CTRL support for PSBT signing",
        chain,
      });
    },
    
    // Throw informative error for sign and broadcast attempts
    signAndBroadcast: async (): Promise<never> => {
      throw new SwapKitError("wallet_ctrl_psbt_signing_not_supported", {
        solution: "Use transfer method instead or contact CTRL support for PSBT signing",
        chain,
      });
    },
  };
}
```

### Phase 3: Update Wallet Integration

Modify `/packages/wallets/src/ctrl/index.ts`:

```typescript
async function getWalletMethods(chain: Chain) {
  switch (chain) {
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const { getUTXOBuilderMethods } = await import("./utxo-builder");
      
      const toolbox = await getUtxoToolbox(chain);
      const builderMethods = getUTXOBuilderMethods(chain);
      
      return { 
        ...toolbox, 
        ...builderMethods,
        transfer: walletTransfer,
        // Override signing to show clear error
        sign: builderMethods.sign,
        signAndBroadcast: builderMethods.signAndBroadcast,
      };
    }
    
    // EVM chains - full signing support
    case Chain.Ethereum:
    case Chain.BinanceSmartChain:
    // ... other EVM chains
    {
      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = await getEvmToolbox(chain, { provider, signer });
      const signingMethods = await getEVMSigningMethods(provider, chain);
      
      return {
        ...toolbox,
        ...ctrlMethods,
        ...signingMethods,
      };
    }
    
    // Solana - full signing support
    case Chain.Solana: {
      const solanaProvider = window.xfi?.solana;
      const toolbox = getSolanaToolbox({ signer: solanaProvider });
      const signingMethods = getSolanaSigningMethods(solanaProvider);
      
      return { 
        ...toolbox,
        ...signingMethods,
      };
    }
  }
}
```

### Phase 4: Error Handling & User Guidance

Create clear error messages when unsupported operations are attempted:

```typescript
export class CTRLWalletError extends SwapKitError {
  constructor(operation: string, chain: Chain, alternative?: string) {
    super({
      errorKey: "wallet_ctrl_operation_not_supported",
      info: {
        operation,
        chain,
        message: `CTRL wallet does not support ${operation} for ${chain}`,
        alternative: alternative || "Use the transfer method instead",
        documentation: "https://docs.swapkit.dev/wallets/ctrl#limitations",
      },
    });
  }
}
```

### Phase 5: Documentation

Create comprehensive documentation:

1. **Capabilities Matrix**
   ```markdown
   ## CTRL Wallet Capabilities
   
   | Chain | Sign | Sign & Broadcast | Transfer | Build Tx |
   |-------|------|-----------------|----------|----------|
   | Bitcoin | ❌ | ❌ | ✅ | ✅ |
   | Ethereum | ✅ | ✅ | ✅ | ✅ |
   | Solana | ✅ | ✅ | ✅ | ✅ |
   ```

2. **Migration Guide**
   ```typescript
   // Before (attempting PSBT signing)
   try {
     const signed = await wallet.signPSBT(psbt);
   } catch (error) {
     // Handle error
   }
   
   // After (using CTRL transfer)
   if (wallet.type === WalletOption.CTRL && isUTXOChain(chain)) {
     // Use transfer API directly
     const txHash = await wallet.transfer(params);
   } else {
     // Standard signing flow
     const signed = await wallet.signPSBT(psbt);
   }
   ```

3. **Best Practices**
   - Always check wallet capabilities before attempting operations
   - Provide fallback mechanisms for unsupported operations
   - Guide users to alternative methods when signing isn't available

## Testing Strategy

### Unit Tests
```typescript
describe("CTRL Wallet", () => {
  describe("UTXO Chains", () => {
    it("should throw informative error for PSBT signing", async () => {
      const wallet = await connectCtrl([Chain.Bitcoin]);
      await expect(wallet.signPSBT(psbt)).rejects.toThrow(
        "CTRL wallet does not support PSBT signing"
      );
    });
    
    it("should successfully transfer using CTRL API", async () => {
      const wallet = await connectCtrl([Chain.Bitcoin]);
      const txHash = await wallet.transfer(params);
      expect(txHash).toBeDefined();
    });
  });
  
  describe("EVM Chains", () => {
    it("should sign transactions", async () => {
      const wallet = await connectCtrl([Chain.Ethereum]);
      const signed = await wallet.signTransaction(tx);
      expect(signed).toBeDefined();
    });
  });
});
```

### Integration Tests
- Test with CTRL wallet browser extension
- Verify transfer operations work correctly
- Ensure error messages are helpful
- Test fallback mechanisms

## Timeline

### Week 1: Foundation
- Day 1-2: Implement capability detection system
- Day 3-4: Create EVM and Solana signing methods
- Day 5: Build UTXO transaction builder

### Week 2: Integration
- Day 1-2: Update CTRL wallet integration
- Day 3: Implement error handling
- Day 4-5: Write documentation

### Week 3: Testing & Refinement
- Day 1-2: Unit tests
- Day 3: Integration tests
- Day 4-5: User testing and feedback

## Future Enhancements

### Short-term (1-2 months)
1. Work with CTRL team to request PSBT signing API
2. Implement transaction status monitoring
3. Add transaction fee estimation for CTRL transfers

### Long-term (3-6 months)
1. Full PSBT signing support (pending CTRL API)
2. Batch transaction support
3. Advanced transaction building with custom scripts

## Risk Mitigation

### Technical Risks
- **Missing PSBT signing**: Users expect signing capability
  - *Mitigation*: Clear documentation, helpful errors, transfer fallback

- **API changes**: CTRL might change their API
  - *Mitigation*: Version detection, compatibility layer

### User Experience Risks
- **Confusion about capabilities**: Users don't understand limitations
  - *Mitigation*: Clear UI indicators, capability checks, guided flows

## Conclusion

While CTRL wallet doesn't expose direct signing for UTXO chains, we can provide a functional implementation that:
1. Uses CTRL's transfer API for UTXO operations
2. Provides full signing for EVM and Solana
3. Clearly communicates limitations
4. Guides users to appropriate alternatives

This approach maintains SwapKit's consistent interface while working within CTRL's constraints. Future CTRL API enhancements could enable full signing support.