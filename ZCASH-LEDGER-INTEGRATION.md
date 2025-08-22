# Ledger Zcash Integration Guide

## Current Status
Ledger hardware wallet does not currently support Zcash in SwapKit. Ledger devices DO support Zcash natively, but integration is needed.

## Prerequisites
- Ledger Zcash app installed on device (available in Ledger Live)
- Ledger firmware supporting Zcash
- Research into Ledger's Zcash Shielded App (in development 2024)

## Integration Path

### Step 1: Research Ledger Library Support
Check if `@ledgerhq/hw-app-btc` supports Zcash or if a separate library is needed:
```bash
# Look for Zcash support in Ledger libraries
npm search @ledgerhq zcash
```

Potential libraries:
- `@ledgerhq/hw-app-zcash` (if exists)
- Custom implementation using `@ledgerhq/hw-transport`

### Step 2: Add Zcash Chain Support
**File**: `packages/wallet-hardware/src/ledger/chains/utxo.ts`

Add Zcash to supported chains:
```typescript
import { Chain } from "@swapkit/helpers";

// Add Zcash to the chain list
const supportedChains = [
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
  Chain.Zcash, // Add this
];
```

### Step 3: Implement Zcash-Specific Logic
Create new file: `packages/wallet-hardware/src/ledger/chains/zcash.ts`

```typescript
import Transport from "@ledgerhq/hw-transport";
import { Chain } from "@swapkit/helpers";

export class LedgerZcash {
  private transport: Transport;
  
  constructor(transport: Transport) {
    this.transport = transport;
  }
  
  async getAddress(derivationPath: string): Promise<string> {
    // Implement Zcash-specific address generation
    // Use APDU commands for Zcash app
    const path = parseBIP44Path(derivationPath);
    
    // Send APDU command to get address
    const response = await this.transport.send(
      0xe0, // CLA
      0x40, // INS (get address)
      0x00, // P1
      0x00, // P2
      Buffer.from(path)
    );
    
    return parseZcashAddress(response);
  }
  
  async signTransaction(psbt: string): Promise<string> {
    // Implement Zcash transaction signing
    // This will be more complex due to Zcash's unique transaction format
  }
}
```

### Step 4: Update UTXO Handler
**File**: `packages/wallet-hardware/src/ledger/chains/utxo.ts`

Add Zcash-specific handling:
```typescript
const getUTXODerivationPath = (chain: UTXOChain, index: number) => {
  const coinType = {
    [Chain.Bitcoin]: 0,
    [Chain.BitcoinCash]: 145,
    [Chain.Dash]: 5,
    [Chain.Dogecoin]: 3,
    [Chain.Litecoin]: 2,
    [Chain.Zcash]: 133, // Add Zcash coin type
  }[chain];
  
  return `m/44'/${coinType}'/0'/0/${index}`;
};
```

### Step 5: Handle Zcash Transaction Format
Zcash transactions have unique requirements:
```typescript
interface ZcashTransaction {
  version: number; // Version group ID for Zcash
  overwintered: boolean; // Zcash-specific flag
  versionGroupId: string;
  consensusBranchId: string; // NU6 or current branch
  expiryHeight?: number;
  // ... standard UTXO fields
}
```

## Technical Considerations

### Ledger App Requirements
- **Transparent Addresses**: Supported via standard Zcash app
- **Shielded Addresses**: Requires new Shielded App (in development)
- **Firmware Version**: Minimum Nano S Plus or Nano X recommended

### Address Types
- ✅ Transparent addresses (t1..., t3...)
- ⚠️ Shielded addresses (requires Shielded App)
- ❌ Unified addresses (not yet supported)

### Transaction Signing
- Standard UTXO signing for transparent transactions
- Special handling for Zcash's overwinter/sapling parameters
- Consensus branch ID must be included

## Implementation Approach

### Option 1: Use Bitcoin App with Modifications
```typescript
// Attempt to use existing Bitcoin app with Zcash parameters
const btc = new AppBtc(transport);
// Modify for Zcash-specific requirements
```

### Option 2: Direct APDU Communication
```typescript
// Direct communication with Zcash app
const ZCASH_CLA = 0xE0;
const GET_ADDRESS = 0x40;
const SIGN_TX = 0x44;

// Implement custom APDU commands
```

### Option 3: Wait for Official Library
Monitor Ledger's GitHub for official Zcash library release.

## Testing Requirements

### Unit Tests
```typescript
describe("Ledger Zcash Integration", () => {
  it("should generate transparent address", async () => {
    const address = await ledger.getAddress(Chain.Zcash, 0);
    expect(address).toMatch(/^t1[a-zA-Z0-9]{33}$/); // Mainnet
  });
  
  it("should sign transparent transaction", async () => {
    const psbt = createZcashPSBT();
    const signed = await ledger.signTransaction(psbt);
    expect(signed).toBeDefined();
  });
});
```

### Integration Tests
1. Test with Ledger simulator
2. Test with real device on testnet
3. Verify address generation matches Ledger Live
4. Validate transaction signing and broadcasting

## Risk Assessment
- **High Complexity**: Zcash has unique transaction format
- **Library Dependency**: May need custom APDU implementation
- **Device Compatibility**: Requires Zcash app installation

## Estimated Timeline
- Research & Prototype: 3-5 days
- Implementation: 5-7 days
- Testing: 3-5 days
- Documentation: 2 days
- **Total**: 2-3 weeks

## Dependencies
- Ledger Zcash app on device
- Transport library (@ledgerhq/hw-transport)
- Possible custom APDU implementation
- Zcash transaction format knowledge

## Resources
- [Ledger Zcash App GitHub](https://github.com/Zondax/ledger-zcash)
- [Ledger Developer Portal](https://developers.ledger.com/)
- [Zcash Protocol Specification](https://zips.z.cash/)
- [Ledger APDU Documentation](https://developers.ledger.com/docs/transport/overview/)

## Next Steps
1. Install and test Ledger Zcash app
2. Investigate APDU commands for Zcash
3. Prototype address generation
4. Implement transaction signing
5. Comprehensive testing
6. Documentation and release