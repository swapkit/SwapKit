import { type AssetValue, Chain } from "@swapkit/helpers";
import { buildAminoMsg, getCosmosToolbox } from "@swapkit/toolboxes/cosmos";
import { fromByteArray } from "base64-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SwapKitClient } from "../swapKitClient";

export default function Multisig({
  inputAsset,
  skClient,
  phrase,
}: {
  skClient?: SwapKitClient;
  inputAsset?: AssetValue;
  phrase: string;
}) {
  const toolbox = useMemo(async () => await getCosmosToolbox(Chain.THORChain), []);
  const [pubkeys, setPubkeys] = useState({ 0: "", 1: "" });
  const [threshold, setThreshold] = useState(2);
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [address, setAddress] = useState("");
  const [transaction, setTransaction] = useState<any | undefined>(undefined);
  const [signatures, setSignatures] = useState<{ [key: string]: string }>({});
  const [bodyBytes, setBodyBytes] = useState<Uint8Array>(new Uint8Array([]));
  const [transactionHash, setTransactionHash] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [nonMultisigPubKey, setNonMultisigPugKey] = useState("");
  const [inputAssetValue, setInput] = useState(inputAsset?.mul(0));

  const loadPubKey = useCallback(async () => {
    if (phrase) {
      const wallet = await (await toolbox).secp256k1HdWalletFromMnemonic(phrase);
      const [account] = await wallet.getAccounts();

      if (!account) return alert("No account found");

      setNonMultisigPugKey(fromByteArray(account.pubkey));
    }
  }, [phrase, toolbox]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: skip
  useEffect(() => {
    loadPubKey();
  }, [loadPubKey, phrase]);

  const handleLoadMultisig = useCallback(async () => {
    const pubkey = await (await toolbox).createMultisig(Object.values(pubkeys), threshold);
    const address = await (await toolbox).pubkeyToAddress(pubkey);

    setAddress(address);
  }, [toolbox, pubkeys, threshold]);

  const handlePubkeyChange = useCallback((index: number, value: string) => {
    setPubkeys((pubkeys) => ({ ...pubkeys, [index]: value }));
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      inputAsset && setInput(inputAsset.mul(0).add(value));
    },
    [inputAsset],
  );

  const handleCreateTransaction = useCallback(() => {
    if (!(inputAssetValue?.gt(0) && skClient)) return;
    const transferTx = buildAminoMsg({ assetValue: inputAssetValue, memo, recipient, sender: address });

    setTransaction(transferTx);
  }, [address, inputAssetValue, memo, recipient, skClient]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: skip
  const handleSignTransaction = useCallback(async () => {
    const wallet = await (await toolbox).secp256k1HdWalletFromMnemonic(phrase);
    const { signature, bodyBytes } = await (await toolbox).signMultisigTx({ tx: transaction, wallet });
    setBodyBytes(bodyBytes);
    const [account] = await wallet.getAccounts();

    if (!account) return alert("No account found");

    setSignatures((signatures) => ({ ...signatures, [fromByteArray(account.pubkey)]: signature }));
  }, [phrase, toolbox, transaction, setBodyBytes]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: skip
  const handleBroadcastTransaction = useCallback(async () => {
    setIsBroadcasting(true);
    const txHash = await (await toolbox).broadcastMultisigTx(
      JSON.stringify(transaction),
      Object.entries(signatures).map(([pubKey, signature]) => ({ pubKey, signature })),
      Object.values(pubkeys),
      threshold,
      bodyBytes,
    );
    setIsBroadcasting(false);
    setTransactionHash(txHash);
  }, [bodyBytes, signatures, threshold, toolbox, transaction]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ backgroundColor: "#1a1a1a", borderRadius: 4, color: "#999", fontSize: 11, padding: 8 }}>
          Your current pubkey: <span style={{ color: "#fff", fontFamily: "monospace" }}>{nonMultisigPubKey}</span>
        </div>
        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Threshold:</label>
          <input
            onChange={(e) => setThreshold(+e.target.value)}
            step="1"
            style={{ fontSize: 13, width: "100%" }}
            type="number"
            value={threshold}
          />
        </div>
        <div>
          <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Public keys:</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.values(pubkeys).map((pubkey, index) => (
              <input
                key={index}
                onChange={(e) => handlePubkeyChange(index, e.target.value)}
                placeholder="Base 64 pubkey"
                style={{ fontFamily: "monospace", fontSize: 11, width: "100%" }}
                value={pubkey}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleLoadMultisig}
          style={{
            backgroundColor: "#2563eb",
            borderColor: "#2563eb",
            color: "#fff",
            fontSize: 12,
            padding: "10px 16px",
          }}
          type="button">
          Load multisig wallet
        </button>
        {address && (
          <div style={{ backgroundColor: "#1a1a1a", borderRadius: 4, color: "#16a34a", fontSize: 11, padding: 8 }}>
            Multisig address: <span style={{ fontFamily: "monospace" }}>{address}</span>
          </div>
        )}
      </div>

      {address && (
        <div
          style={{
            borderTop: "1px solid #222",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 8,
            paddingTop: 16,
          }}>
          <div style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>TRANSACTION</div>
          <div style={{ color: "#999", fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>Input Asset:</span> {inputAsset?.toSignificant(6)} {inputAsset?.ticker}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Input Amount:</label>
              <input
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.0"
                style={{ fontSize: 13, width: "100%" }}
                value={inputAssetValue?.toSignificant(6)}
              />
            </div>

            <div>
              <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Recipient:</label>
              <input
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="address"
                style={{ fontSize: 13, width: "100%" }}
                value={recipient}
              />
            </div>
            <div>
              <label style={{ color: "#666", display: "block", fontSize: 11, marginBottom: 4 }}>Memo:</label>
              <input
                onChange={(e) => setMemo(e.target.value)}
                placeholder="memo"
                style={{ fontSize: 13, width: "100%" }}
                value={memo}
              />
            </div>

            <button
              disabled={!inputAsset}
              onClick={handleCreateTransaction}
              style={{
                backgroundColor: "#2563eb",
                borderColor: "#2563eb",
                color: "#fff",
                fontSize: 12,
                padding: "10px 16px",
              }}
              type="button">
              Create transaction
            </button>

            {transaction && (
              <div style={{ backgroundColor: "#1a1a1a", borderRadius: 4, color: "#16a34a", fontSize: 11, padding: 8 }}>
                Transaction created successfully
              </div>
            )}
          </div>

          {transaction && (
            <div
              style={{
                borderTop: "1px solid #222",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
                paddingTop: 16,
              }}>
              <div style={{ color: "#999", fontSize: 12, fontWeight: 600 }}>SIGNATURES</div>
              <button
                onClick={handleSignTransaction}
                style={{
                  backgroundColor: "#2563eb",
                  borderColor: "#2563eb",
                  color: "#fff",
                  fontSize: 12,
                  padding: "10px 16px",
                }}
                type="button">
                Sign Transaction
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.keys(signatures).length === 0 ? (
                  <div style={{ color: "#666", fontSize: 11 }}>There are currently no signatures</div>
                ) : (
                  Object.entries(signatures).map(([pubkey, signature]) => (
                    <div
                      key={pubkey}
                      style={{
                        backgroundColor: "#1a1a1a",
                        borderRadius: 4,
                        color: "#999",
                        fontFamily: "monospace",
                        fontSize: 10,
                        padding: 8,
                        wordBreak: "break-all",
                      }}>
                      {pubkey} → {signature}
                    </div>
                  ))
                )}
              </div>

              {Object.entries(signatures).length >= threshold && (
                <button
                  disabled={isBroadcasting}
                  onClick={handleBroadcastTransaction}
                  style={{
                    backgroundColor: "#16a34a",
                    borderColor: "#16a34a",
                    color: "#fff",
                    fontSize: 12,
                    padding: "10px 16px",
                  }}
                  type="button">
                  {isBroadcasting ? "Broadcasting..." : "Broadcast"}
                </button>
              )}

              {transactionHash && (
                <div
                  style={{ backgroundColor: "#1a1a1a", borderRadius: 4, color: "#16a34a", fontSize: 11, padding: 8 }}>
                  Transaction sent! Hash: <span style={{ fontFamily: "monospace" }}>{transactionHash}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
