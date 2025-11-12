"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const keystoreSchema = z.object({
  keystoreFile: z.custom<FileList>().refine((files) => files?.length === 1, "File required"),
  password: z.string().min(1, "Password is required"),
});

type KeystoreFormData = z.infer<typeof keystoreSchema>;

export function WalletKeystoreConnectDialog() {
  const modal = useModal();

  const [currentStep, setCurrentStep] = useState("1");

  const {
    // handleKeystoreFileUpload,
    // connectKeystoreWallet,
    keystoreFile,
    // keystoreError,
    isKeystoreDecrypting,
    setIsKeystoreDecrypting,
    // clearKeystoreError,
  } = useSwapKit();

  // const { decryptFromKeystore: workerDecryptFromKeystore, isReady: isWorkerReady } = useKeystoreWorker?.() || {};

  const form = useForm<KeystoreFormData>({ defaultValues: { password: "" }, resolver: zodResolver(keystoreSchema) });

  const uploadedFiles = form.watch("keystoreFile");
  const selectedFile = uploadedFiles?.[0];

  const handleFileUpload = useCallback(async () => {
    // if (!selectedFile) {
    //   toast.error("Please select a keystore file");
    //   return;
    // }
    // try {
    //   clearKeystoreError();
    //   const chains = [Chain.THORChain, Chain.Maya];
    //   await handleKeystoreFileUpload(selectedFile, chains);
    //   setCurrentStep("2");
    //   toast.success("Keystore file uploaded successfully");
    // } catch {
    //   toast.error("Failed to upload keystore file");
    // }
  }, []);

  // const handleConnect = useCallback(
  //   async (_data: KeystoreFormData) => {
  //     if (!keystoreFile) {
  //       toast.error("No keystore file uploaded");
  //       return;
  //     }

  //     setIsKeystoreDecrypting(true);
  //     clearKeystoreError();
  //     try {
  //       // Decrypt keystore to get phrase using worker if available, fallback to main thread
  //       let phrase: string;
  //       if (isWorkerReady) {
  //       phrase = await workerDecryptFromKeystore(keystoreFile.keystore, data.password);
  //       } else {
  //       const { decryptFromKeystore } = await import("@swapkit/wallets/keystore");
  //       phrase = await decryptFromKeystore(keystoreFile.keystore, data.password);
  //       }

  //       if (!phrase) {
  //         throw new Error("Failed to decrypt keystore");
  //       }

  //       // Connect wallet using the phrase (phrase cleared after this call)
  //       await connectKeystoreWallet(phrase, keystoreFile.chains);
  //       setCurrentStep("3");

  //       toast.success("Wallet connected successfully!");
  //       onConnect();
  //     } catch {
  //       toast.error(keystoreError || "Failed to decrypt keystore or connect wallet.\nPlease check your password.");
  //     } finally {
  //       setIsKeystoreDecrypting(false);
  //     }
  //   },
  //   [keystoreFile, setIsKeystoreDecrypting],
  // );

  const canContinue =
    (currentStep === "1" && Boolean(selectedFile)) ||
    (currentStep === "2" && form.formState.isValid) ||
    currentStep === "3";

  const canGoBack = currentStep !== "1";

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect keystore wallet</DialogTitle>
        </DialogHeader>

        {/* TODO: Add Tabs here */}

        <div className="flex flex-col pt-4">
          {/* TODO: add <Separator /> */}

          <div className="flex items-center justify-between px-6 py-4">
            {canGoBack ? (
              <Button
                disabled={isKeystoreDecrypting}
                onClick={() => {
                  if (currentStep === "2") {
                    setCurrentStep("1");
                  } else if (currentStep === "3") {
                    setCurrentStep("2");
                  }
                }}>
                Back
              </Button>
            ) : (
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
            )}

            {currentStep === "1" && (
              <Button disabled={!canContinue} onClick={handleFileUpload} variant="primary">
                Upload File
              </Button>
            )}

            {currentStep === "2" && (
              <Button
                disabled={!canContinue}
                isLoading={isKeystoreDecrypting}
                // onClick={form.handleSubmit(handleConnect)}
                variant="primary">
                Connect Wallet
              </Button>
            )}

            {currentStep === "3" && (
              <DialogClose asChild>
                <Button variant="primary">Done</Button>
              </DialogClose>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
