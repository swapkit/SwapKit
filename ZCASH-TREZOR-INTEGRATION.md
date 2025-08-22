# Trezor Zcash Integration Guide

## Current Status
Trezor hardware wallet does not currently support Zcash in SwapKit. Trezor devices DO support Zcash natively through Trezor Connect.

## Prerequisites
- Trezor firmware 2.0.10+ (Zcash support)
- Trezor Connect library v9+
- Understanding of Trezor Connect API

## Integration Path

### Step 1: Verify Trezor Connect Support
Check Trezor Connect for Zcash methods:
```typescript
import TrezorConnect from "@trezor/connect-web";

// Initialize with Zcash support
TrezorConnect.init({
  manifest: {
    email: "developer@swapkit.dev",
    appUrl: "https://swapkit.dev",
  },
});
```

### Step 2: Add Zcash Chain Support
**File**: `packages/wallet-hardware/src/trezor/chains/utxo.ts`

Add Zcash to supported chains:
```typescript
const SUPPORTED_CHAINS = [
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
  Chain.Zcash, // Add this
];

const getCoinName = (chain: UTXOChain): string => {
  const coinMap = {
    [Chain.Bitcoin]: "btc",
    [Chain.BitcoinCash]: "bch",
    [Chain.Dash]: "dash",
    [Chain.Dogecoin]: "doge",
    [Chain.Litecoin]: "ltc",
    [Chain.Zcash]: "zec", // Add Zcash coin name
  };
  return coinMap[chain];
};
```

### Step 3: Implement Zcash Address Generation
```typescript
export const getZcashAddress = async (
  path: string,
  showOnTrezor = false
): Promise<string> => {
  const result = await TrezorConnect.getAddress({
    path,
    coin: "zec",
    showOnTrezor,
  });

  if (!result.success) {
    throw new Error(result.payload.error);
  }

  return result.payload.address;
};
```

### Step 4: Implement Zcash Transaction Signing
```typescript
export const signZcashTransaction = async (
  inputs: Array<TrezorInput>,
  outputs: Array<TrezorOutput>,
  refTxs?: Array<RefTransaction>
): Promise<SignedTransaction> => {
  const result = await TrezorConnect.signTransaction({
    inputs: inputs.map(input => ({
      ...input,
      amount: input.amount.toString(),
      script_type: "SPENDADDRESS", // For transparent addresses
    })),
    outputs: outputs.map(output => ({
      ...output,
      amount: output.amount.toString(),
      script_type: "PAYTOADDRESS",
    })),
    coin: "zec",
    refTxs, // Previous transactions for verification
    version: 5, // Zcash NU5 version
    versionGroupId: 0x26A7270A, // NU5 version group ID
    branchId: 0xC2D6D0B4, // NU5 consensus branch ID
    overwintered: true, // Zcash-specific flag
  });

  if (!result.success) {
    throw new Error(result.payload.error);
  }

  return result.payload;
};
```

### Step 5: Update UTXO Handler
**File**: `packages/wallet-hardware/src/trezor/index.ts`

Add Zcash-specific handling:
```typescript
class TrezorWallet {
  async getAddress(chain: Chain, index: number): Promise<string> {
    if (chain === Chain.Zcash) {
      const path = `m/44'/133'/0'/0/${index}`;
      return getZcashAddress(path);
    }
    // ... existing logic
  }

  async signTransaction(
    chain: Chain,
    psbt: string
  ): Promise<string> {
    if (chain === Chain.Zcash) {
      // Parse PSBT and prepare for Trezor format
      const { inputs, outputs } = parseZcashPSBT(psbt);
      const signed = await signZcashTransaction(inputs, outputs);
      return signed.serializedTx;
    }
    // ... existing logic
  }
}
```

## Technical Considerations

### Trezor Connect API
Trezor Connect provides native Zcash support with:
- Transparent address generation
- Transaction signing with Zcash-specific parameters
- Proper version and branch ID handling

### Supported Features
- ✅ Transparent addresses (t1..., t3...)
- ✅ HD wallet derivation (BIP44)
- ✅ Transaction signing with overwinter support
- ✅ Mainnet and testnet support

### Not Supported
- ❌ Shielded addresses (z-addresses)
- ❌ Shielded transactions
- ❌ Orchard pool transactions

### Zcash-Specific Parameters
```typescript
interface ZcashTxParams {
  version: 5; // NU5 and later
  versionGroupId: number; // Version group identifier
  branchId: number; // Consensus branch ID
  overwintered: true; // Always true for Zcash
  expiryHeight?: number; // Optional expiry
}
```

## Implementation Example

### Complete Integration
```typescript
// trezor/chains/zcash.ts
import TrezorConnect from "@trezor/connect-web";
import { Chain } from "@swapkit/helpers";

export class TrezorZcash {
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;
    
    await TrezorConnect.init({
      manifest: {
        email: "developer@swapkit.dev",
        appUrl: "https://swapkit.dev",
      },
    });
    
    this.connected = true;
  }

  async getAddress(index: number = 0): Promise<string> {
    await this.connect();
    
    const result = await TrezorConnect.getAddress({
      path: `m/44'/133'/0'/0/${index}`,
      coin: "zec",
    });

    if (!result.success) {
      throw new Error(result.payload.error);
    }

    return result.payload.address;
  }

  async signPSBT(psbtHex: string): Promise<string> {
    await this.connect();
    
    // Parse PSBT to Trezor format
    const psbt = Psbt.fromHex(psbtHex);
    const inputs = this.psbtToTrezorInputs(psbt);
    const outputs = this.psbtToTrezorOutputs(psbt);
    
    const result = await TrezorConnect.signTransaction({
      inputs,
      outputs,
      coin: "zec",
      version: 5,
      versionGroupId: 0x26A7270A,
      branchId: 0xC2D6D0B4,
      overwintered: true,
    });

    if (!result.success) {
      throw new Error(result.payload.error);
    }

    return result.payload.serializedTx;
  }

  private psbtToTrezorInputs(psbt: Psbt) {
    // Convert PSBT inputs to Trezor format
    return psbt.txInputs.map((input, index) => ({
      address_n: [2147483692, 2147483781, 2147483648, 0, index],
      prev_hash: input.hash.toString("hex"),
      prev_index: input.index,
      amount: psbt.data.inputs[index].witnessUtxo?.value.toString() || "0",
      script_type: "SPENDADDRESS",
    }));
  }

  private psbtToTrezorOutputs(psbt: Psbt) {
    // Convert PSBT outputs to Trezor format
    return psbt.txOutputs.map(output => ({
      address: output.address,
      amount: output.value.toString(),
      script_type: "PAYTOADDRESS",
    }));
  }
}
```

## Testing Requirements

### Unit Tests
```typescript
describe("Trezor Zcash Integration", () => {
  let trezor: TrezorZcash;

  beforeEach(() => {
    trezor = new TrezorZcash();
  });

  it("should generate transparent address", async () => {
    const address = await trezor.getAddress(0);
    expect(address).toMatch(/^t1[a-zA-Z0-9]{33}$/);
  });

  it("should sign transaction", async () => {
    const psbt = createTestZcashPSBT();
    const signed = await trezor.signPSBT(psbt);
    expect(signed).toBeDefined();
  });
});
```

### Integration Tests
1. Test with Trezor emulator
2. Test with physical device
3. Verify addresses match Trezor Suite
4. Test transaction signing and broadcasting
5. Test error handling and edge cases

## Risk Assessment
- **Low Risk**: Trezor Connect has native Zcash support
- **Medium Complexity**: Need to handle Zcash-specific parameters
- **Device Requirements**: User needs Zcash enabled in Trezor

## Estimated Timeline
- Research & Setup: 1-2 days
- Implementation: 3-4 days
- Testing: 2-3 days
- Documentation: 1 day
- **Total**: 1-1.5 weeks

## Dependencies
- `@trezor/connect-web` v9+
- Trezor firmware with Zcash support
- BitcoinJS lib for PSBT handling

## Resources
- [Trezor Connect Documentation](https://github.com/trezor/connect/blob/develop/docs/methods/getAddress.md)
- [Trezor Zcash Support](https://trezor.io/coins/#ZEC)
- [Trezor Connect Examples](https://github.com/trezor/connect-examples)
- [Zcash in Trezor Firmware](https://github.com/trezor/trezor-firmware/tree/master/core/src/apps/zcash)

## Implementation Checklist
- [ ] Add Zcash to supported chains list
- [ ] Implement address generation via Trezor Connect
- [ ] Implement transaction signing with Zcash parameters
- [ ] Add PSBT to Trezor format converter
- [ ] Create comprehensive test suite
- [ ] Test with emulator and real device
- [ ] Update documentation
- [ ] Add example usage

## Next Steps
1. Set up Trezor Connect in development
2. Test basic Zcash operations with Trezor emulator
3. Implement address generation
4. Implement transaction signing
5. Integration testing
6. Production deployment