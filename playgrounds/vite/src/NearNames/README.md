# NEAR Names Integration

This component provides a user interface for registering and managing NEAR Names (.near domains) directly from the SwapKit playground.

## Features

- **Automatic Detection**: Automatically appears when a NEAR wallet is connected
- **Name Availability Check**: Check if a desired .near name is available
- **Dynamic Pricing**: Shows registration cost based on name length
- **Name Registration**: Register new .near names with one click
- **Owned Names Display**: Shows all names owned by the connected wallet
- **Input Validation**: Validates name format and length requirements

## Name Rules

- Minimum length: 2 characters
- Maximum length: 64 characters
- Allowed characters: lowercase letters (a-z), numbers (0-9), and hyphens (-)
- Cannot start or end with a hyphen
- No consecutive hyphens

## Pricing

- 2 characters: 100 NEAR
- 3 characters: 50 NEAR
- 4 characters: 10 NEAR
- 5 characters: 5 NEAR
- 6+ characters: 1 NEAR

## Usage

1. Connect a NEAR wallet using the wallet picker
2. The NEAR Names modal will automatically appear in the bottom-right corner
3. Enter your desired name (without the .near suffix)
4. Click "Check Availability" to verify the name is available
5. If available, click "Register" to complete the registration
6. The transaction will be signed and broadcast through your connected wallet

## Technical Details

The component uses the NEAR toolbox's `nearNames` helper which interacts with the official NEAR names contract. It handles:
- Name resolution
- Availability checks
- Registration transactions
- Ownership lookups

The modal can be closed using the × button and will automatically hide when the NEAR wallet is disconnected.