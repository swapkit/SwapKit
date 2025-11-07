# Test Logging Improvements

## Overview
This document describes the improvements made to logging during test execution to provide cleaner, more readable output without losing important debugging information.

## Problem
Previously, when running tests, error logs were very verbose with full stack traces that made it difficult to:
- Identify the actual error message
- See the test results clearly
- Quickly spot issues in test runs
- Understand what was failing without scrolling through hundreds of lines

Example of BEFORE:
```
Failed to fetch token info for 0x1234 on ETH: TypeError: invalid address (argument="address", value="0x1234", code=INVALID_ARGUMENT, version=6.15.0)
   argument: "address",
      value: "0x1234",
 shortMessage: "invalid address",
       code: "INVALID_ARGUMENT"

      at makeError (/Users/chillios/Projects/swapkit/sdk/node_modules/.bun/ethers@6.15.0/node_modules/ethers/lib.esm/utils/errors.js:125:25)
      at assert (/Users/chillios/Projects/swapkit/sdk/node_modules/.bun/ethers@6.15.0/node_modules/ethers/lib.esm/utils/errors.js:151:15)
      at assertArgument (/Users/chillios/Projects/swapkit/sdk/node_modules/.bun/ethers@6.15.0/node_modules/ethers/lib.esm/utils/errors.js:162:5)
      at getAddress (/Users/chillios/Projects/swapkit/sdk/node_modules/.bun/ethers@6.15.0/node_modules/ethers/lib.esm/address/address.js:128:5)
      ... (many more lines)
```

Example of AFTER:
```
Failed to fetch token info for 0x1234 on ETH: invalid address (argument="address", value="0x1234", code=INVALID_ARGUMENT, version=6.15.0)
```

## Changes Made

### 1. Compact Error Logging in helpers/src/utils/asset.ts
Updated all `console.warn` and `console.error` calls to extract just the error message instead of logging the full error object:

**Before:**
```typescript
console.warn(`Failed to fetch token info for ${address} on ${chain}:`, error);
```

**After:**
```typescript
const errorMessage = error instanceof Error ? error.message : String(error);
console.warn(`Failed to fetch token info for ${address} on ${chain}: ${errorMessage}`);
```

**Files updated:**
- `packages/helpers/src/utils/asset.ts` - Multiple error handlers for token fetching
- `packages/helpers/src/modules/swapKitError.ts` - SwapKitError constructor logging
- `packages/toolboxes/src/substrate/balance.ts` - Balance fetch errors
- `packages/toolboxes/src/utxo/helpers/api.ts` - UTXO API errors  
- `packages/toolboxes/src/tron/toolbox.ts` - Tron balance errors
- `packages/toolboxes/src/cardano/toolbox.ts` - Cardano balance errors

### 2. Improved SwapKitError Logging
The SwapKitError class now provides more concise logging while preserving important information:

**Before:**
```typescript
if (sourceErrorOrInfo) {
  console.error(`SwapKitError [${errorKey}]:`, sourceErrorOrInfo);
}
```

**After:**
```typescript
if (sourceErrorOrInfo) {
  const errorMsg = sourceErrorOrInfo instanceof Error 
    ? `${sourceErrorOrInfo.message}${sourceErrorOrInfo.cause ? ` (${sourceErrorOrInfo.cause})` : ''}`
    : JSON.stringify(sourceErrorOrInfo);
  console.error(`SwapKitError [${errorKey}]: ${errorMsg}`);
}
```

## Benefits

1. **Cleaner Test Output**: Error messages are now single-line and easy to scan
2. **Preserved Information**: All important error details are still logged (message, arguments, codes)
3. **Faster Debugging**: Developers can quickly identify what failed without parsing stack traces
4. **Better CI Output**: Shorter logs make CI/CD pipeline outputs more manageable
5. **Consistent Format**: All error logs follow the same pattern across the codebase

## Running Tests

Tests can be run as before:

```bash
# Run all tests
bun test

# Run specific test file
bun test packages/helpers/src/modules/__tests__/assetValue.test.ts

# Run tests with coverage
bun test:coverage
```

## Future Enhancements

### Optional: Environment Variable for Verbosity
If full stack traces are needed for debugging, you could add an environment variable:

```bash
# Verbose mode with full stack traces (future enhancement)
DEBUG=true bun test

# Or LOG_LEVEL=debug bun test
```

This would require a small addition to the logging utilities to check for the environment variable.

## Example Test Output

### Before Changes
```
packages/helpers/src/modules/__tests__/assetValue.test.ts:
(pass) AssetValue > fromIdentifier > creates AssetValue from string [0.52ms]
Failed to fetch token info for 0x1234 on ETH: TypeError: invalid address (argument="address", value="0x1234", code=INVALID_ARGUMENT, version=6.15.0)
   argument: "address",
      value: "0x1234",
 shortMessage: "invalid address",
       code: "INVALID_ARGUMENT"

      at makeError (/Users/chillios/Projects/swapkit/sdk/node_modules/.bun/ethers@6.15.0/node_modules/ethers/lib.esm/utils/errors.js:125:25)
      [... 20 more lines of stack trace ...]
      
(pass) AssetValue > fromIdentifier > creates AssetValue from string with multiple dashes [1.61ms]
```

### After Changes
```
packages/helpers/src/modules/__tests__/assetValue.test.ts:
(pass) AssetValue > fromIdentifier > creates AssetValue from string [0.52ms]
Failed to fetch token info for 0x1234 on ETH: invalid address (argument="address", value="0x1234", code=INVALID_ARGUMENT, version=6.15.0)
(pass) AssetValue > fromIdentifier > creates AssetValue from string with multiple dashes [1.61ms]
```

## Technical Notes

- Error extraction pattern: `error instanceof Error ? error.message : String(error)`
- This pattern safely handles both Error objects and other thrown values
- The error message often contains the full context (ethers errors include all relevant info in the message)
- Original error cause chains are preserved where available

## Files Modified

1. `/packages/helpers/src/utils/asset.ts`
2. `/packages/helpers/src/modules/swapKitError.ts`
3. `/packages/toolboxes/src/substrate/balance.ts`
4. `/packages/toolboxes/src/utxo/helpers/api.ts`
5. `/packages/toolboxes/src/tron/toolbox.ts`
6. `/packages/toolboxes/src/cardano/toolbox.ts`

---

**Note**: All tests pass with these changes, and no functionality has been altered - only the logging format has been improved.
