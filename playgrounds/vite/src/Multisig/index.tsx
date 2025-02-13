import type { AssetValue, Chain } from "@swapkit/core";
import { ThorchainToolbox, buildAminoMsg } from "@swapkit/toolboxes/cosmos";
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
  const toolbox = useMemo(() => ThorchainToolbox(), []);
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
      const wallet = await toolbox.secp256k1HdWalletFromMnemonic(phrase);
      const [account] = await wallet.getAccounts();

      if (!account) return alert("No account found");

      setNonMultisigPugKey(fromByteArray(account.pubkey));
    }
  }, [phrase, toolbox]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    loadPubKey();
  }, [loadPubKey, phrase]);

  const handleLoadMultisig = useCallback(async () => {
    const pubkey = await toolbox.createMultisig(Object.values(pubkeys), threshold);
    const address = toolbox.pubkeyToAddress(pubkey, "thor");
    setAddress(address);
  }, [toolbox, pubkeys, threshold]);

  const handlePubkeyChange = useCallback((index: number, value: string) => {
    setPubkeys((pubkeys) => ({
      ...pubkeys,
      [index]: value,
    }));
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      inputAsset && setInput(inputAsset.mul(0).add(value));
    },
    [inputAsset],
  );

  const handleCreateTransaction = useCallback(() => {
    if (!(inputAssetValue?.gt(0) && skClient)) return;
    const transferTx = buildAminoMsg({
      chain: inputAssetValue.chain as Chain.THORChain,
      memo,
      recipient,
      from: address,
      assetValue: inputAssetValue,
    });

    setTransaction(transferTx);
  }, [address, inputAssetValue, memo, recipient, skClient]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleSignTransaction = useCallback(async () => {
    const wallet = await toolbox.secp256k1HdWalletFromMnemonic(phrase);
    const { signature, bodyBytes } = await toolbox.signMultisigTx(
      wallet,
      JSON.stringify(transaction),
    );
    setBodyBytes(bodyBytes);
    const [account] = await wallet.getAccounts();

    if (!account) return alert("No account found");

    setSignatures((signatures) => ({
      ...signatures,
      [fromByteArray(account.pubkey)]: signature,
    }));
  }, [phrase, toolbox, transaction, setBodyBytes]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleBroadcastTransaction = useCallback(async () => {
    setIsBroadcasting(true);
    const txHash = await toolbox.broadcastMultisigTx(
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
    <div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <div>
          <h4>Multisig</h4>
          <div>Your current pubkey: {nonMultisigPubKey}</div>
          <div>
            <span>Threshold:</span>
            <input
              onChange={(e) => setThreshold(+e.target.value)}
              step="1"
              type="number"
              value={threshold}
            />
          </div>
          <div>
            <span>Public keys:</span>
            <div>
              {Object.values(pubkeys).map((pubkey, index) => (
                <div key={pubkey}>
                  <input
                    onChange={(e) => handlePubkeyChange(index, e.target.value)}
                    placeholder="Base 64 pubkey"
                    value={pubkey}
                  />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleLoadMultisig} type="button">
            Load multisig wallet
          </button>
          {address && <div>Multisig address: {address}</div>}
        </div>

        {address && (
          <div>
            <h4>Transaction:</h4>
            <div>
              <div>
                <span>Input Asset: </span>
                {inputAsset?.toSignificant(6)} {inputAsset?.ticker}
              </div>
            </div>

            <div>
              <div>
                <span>Input Amount:</span>
                <input
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="0.0"
                  value={inputAssetValue?.toSignificant(6)}
                />
              </div>

              <div>
                <span>Recipient:</span>
                <input
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="address"
                  value={recipient}
                />
              </div>
              <div>
                <span>Memo:</span>
                <input onChange={(e) => setMemo(e.target.value)} placeholder="memo" value={memo} />
              </div>

              <button disabled={!inputAsset} onClick={handleCreateTransaction} type="button">
                Create transaction
              </button>

              {transaction && <div>Transaction created successfully</div>}
            </div>

            {transaction && (
              <div>
                <h4>Signatures</h4>
                <button onClick={handleSignTransaction} type="button">
                  Sign Transaction
                </button>
                <div>
                  {Object.keys(signatures).length === 0 ? (
                    <div>There are currently no signatures</div>
                  ) : (
                    Object.entries(signatures).map(([pubkey, signature]) => (
                      <div key={pubkey}>
                        {pubkey} --&gt; {signature}{" "}
                      </div>
                    ))
                  )}
                </div>

                {Object.entries(signatures).length >= threshold && (
                  <button
                    disabled={isBroadcasting}
                    onClick={handleBroadcastTransaction}
                    type="button"
                  >
                    Broadcast
                  </button>
                )}

                {isBroadcasting && <div>Broadcasting...</div>}

                {transactionHash && (
                  <div>
                    Hooray! The transaction was sent successfully. Here is your transaction hash{" "}
                    {transactionHash}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
