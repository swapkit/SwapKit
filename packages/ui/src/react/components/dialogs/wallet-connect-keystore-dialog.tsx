"use client";

import { Chain } from "@swapkit/sdk";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { SWAPKIT_WIDGET_TOASTER_ID } from "../ui/sonner";

export const GlobalKeystoreDialog = () => {
  const modal = useModal();
  const { isKeystoreOpen, setIsKeystoreOpen, isKeystoreDecrypting, keystoreFile, setKeystoreFile, connectKeystore } =
    useSwapKit();
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isKeystoreOpen) {
      inputRef.current?.focus();
      setPassword("");
    }
  }, [isKeystoreOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = password.trim();
    if (!(trimmedPassword && keystoreFile)) return;

    try {
      await connectKeystore(trimmedPassword);

      modal.resolve({ confirmed: true, data: null });
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect keystore", {
        description: "Please try again with a valid password.",
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
    }
  };

  const handleCancel = () => {
    setIsKeystoreOpen(false);
    setKeystoreFile(null);
  };

  return (
    <Dialog {...modal}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enter Keystore Password</DialogTitle>
            <DialogDescription>
              Please enter your keystore password to decrypt and connect your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              onChange={async (e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                try {
                  const textFile = await file.text();
                  const keystore = JSON.parse(textFile) as import("@swapkit/sdk/wallets").Keystore;

                  setKeystoreFile({
                    chains: [
                      Chain.Cosmos,
                      Chain.Maya,
                      Chain.THORChain,
                      Chain.Kujira,
                      Chain.Bitcoin,
                      Chain.Ethereum,
                      Chain.Avalanche,
                      Chain.BinanceSmartChain,
                    ],
                    file,
                    keystore,
                  });
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to parse keystore file", {
                    description: "Please try again with a valid keystore file.",
                    toasterId: SWAPKIT_WIDGET_TOASTER_ID,
                  });
                }
              }}
              placeholder="Select keystore file"
              required
              type="file"
            />
            <Input
              className="col-span-3"
              disabled={isKeystoreDecrypting}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              ref={inputRef}
              required
              type="password"
              value={password}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button disabled={isKeystoreDecrypting} onClick={handleCancel} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isKeystoreDecrypting} type="submit">
              {isKeystoreDecrypting ? "Decrypting..." : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
