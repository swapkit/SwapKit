import { AllChains, type Chain, WalletOption } from "@swapkit/core";
import type { SKWalletsSupportedChains } from "@swapkit/wallets";
import { useMemo, useState } from "react";
import { useSwapKit } from "../context";

export function ConnectButton<Wallets extends WalletOption[]>({
  availableWallets,
  availableChains,
  onConnect,
  buttonText = "Connect Wallet",
}: {
  availableWallets?: Wallets;
  availableChains?: Chain[];
  onConnect?: (client: any) => void;
  buttonText?: string;
}) {
  const { connect } = useSwapKit();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallets[number] | undefined>(undefined);
  const [selectedChains, setSelectedChains] = useState<Chain[]>([]);

  const toggleChain = (chain: Chain) => {
    setSelectedChains((prev) => (prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]));
  };

  const handleConnect = async () => {
    if (!(selectedWallet && selectedChains)) return;

    const client = await connect({
      chains: selectedChains as SKWalletsSupportedChains[Wallets[number]],
      walletOption: selectedWallet,
    });

    if (onConnect) onConnect(client);
  };

  const walletOptions = useMemo(() => {
    return availableWallets || Object.values(WalletOption);
  }, [availableWallets]);

  const chains = useMemo(() => {
    return availableChains || AllChains;
  }, [availableChains]);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)} type="button">
        {buttonText}
      </button>

      {isModalOpen && (
        <div className="wallet-modal">
          <div className="wallet-modal-content">
            <button onClick={() => setIsModalOpen(false)} type="button">
              Close
            </button>

            <h3>Select Wallet</h3>
            <div className="wallet-options">
              {walletOptions.map((wallet) => (
                <button key={wallet} onClick={() => setSelectedWallet(wallet)} type="button">
                  {wallet}
                </button>
              ))}
            </div>

            <h3>Select Chains</h3>
            <div className="chain-options">
              {chains.map((chain) => (
                <button key={chain} onClick={() => toggleChain(chain)} type="button">
                  {chain}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleConnect} type="button">
            Connect {selectedWallet} to {selectedChains.join(", ")}
          </button>
        </div>
      )}
    </div>
  );
}
