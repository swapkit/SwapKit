"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const passwordSchema = z
  .object({ confirmPassword: z.string(), password: z.string().min(8, "Password must be at least 8 characters") })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface SeedPhraseDisplayProps {
  phrase: string;
  onBackupConfirmed: (confirmed: boolean) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const _SeedPhraseDisplay: React.FC<SeedPhraseDisplayProps> = ({
  phrase,
  onBackupConfirmed,
  isVisible,
  onToggleVisibility,
}) => {
  const [copied, setCopied] = useState(false);
  const [_confirmed, setConfirmed] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      toast.success("Seed phrase copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [phrase]);

  const _handleConfirmationChange = useCallback(
    (checked: boolean) => {
      setConfirmed(checked);
      onBackupConfirmed(checked);
    },
    [onBackupConfirmed],
  );

  // Clear clipboard when component unmounts
  useEffect(() => {
    return () => {
      navigator.clipboard.writeText("").catch(() => {
        // Ignore errors when clearing clipboard
      });
    };
  }, []);

  const words = useMemo(() => phrase.split(" "), [phrase]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Your Seed Phrase</span>
        <div className="flex gap-2">
          <Button className="h-8 w-8 p-0" onClick={onToggleVisibility} size="sm" variant="outline">
            {isVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
          <Button className="h-8 w-8 p-0" disabled={!isVisible} onClick={handleCopy} size="sm" variant="outline">
            {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-md border p-4">
        {words.map((word, index) => {
          const wordKey = `word-display-${index}`;

          return (
            <div className="flex items-center gap-2 rounded p-2 text-sm" key={wordKey}>
              <span className="w-6 text-muted-foreground text-xs">{index + 1}.</span>
              <span className="font-mono">{isVisible ? word : "••••••"}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-orange-500/20 bg-orange-500/10 p-3">
        <div className="flex items-start gap-2">
          <span className="text-orange-500 text-xs">⚠️</span>
          <div className="text-orange-300 text-xs">
            <p className="mb-1 font-medium">Important Security Notice:</p>
            <ul className="space-y-1">
              <li>Write down your seed phrase on paper</li>
              <li>Store it in a secure location</li>
              <li>Never share it with anyone</li>
              <li>This is the only way to recover your wallet</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* <Checkbox checked={confirmed} id="backup-confirmed" onCheckedChange={handleConfirmationChange} /> */}

        <label
          className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          htmlFor="backup-confirmed">
          I have safely backed up my seed phrase
        </label>
      </div>
    </div>
  );
};

export const WalletKeystoreCreateDialog = ({ onConnect }: { onConnect: () => void }) => {
  const modal = useModal();
  const [currentStep, setCurrentStep] = useState("1");
  const [_generatedPhrase, setGeneratedPhrase] = useState<string>("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [_isPhraseVisible, _setIsPhraseVisiblee] = useState(false);
  const [isGeneratingPhrase, _setIsGeneratingPhrase] = useState(false);
  const [_isProcessingKeystore, _setIsProcessingKeystore] = useState(false);
  const [isConnectKeystoreLoading, _setIsConnectKeystoreLoading] = useState(false);

  const {
    // generateNewSeedPhrase,
    // createKeystore,
    // connectKeystoreWallet,
    // downloadKeystore,
    // keystoreError,
    // keystoreGenerated,
    // isCreatingKeystore,
    // clearKeystoreError,
  } = useSwapKit();

  const form = useForm<PasswordFormData>({
    defaultValues: { confirmPassword: "", password: "" },
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = () => {
    const { password, confirmPassword } = form.getValues();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
    } else {
      void form.handleSubmit(handlePasswordSubmit)();
    }
  };

  const handlePasswordSubmit = useCallback(async (_data: PasswordFormData) => {
    // try {
    //   clearKeystoreError();
    //   setIsGeneratingPhrase(true);
    //   const phrase = await generateNewSeedPhrase();
    //   setGeneratedPhrase(phrase);
    //   setCurrentStep("2");
    // } catch {
    //   toast.error("Failed to generate seed phrase");
    // } finally {
    //   setIsGeneratingPhrase(false);
    // }
  }, []);

  const handleCreateKeystore = useCallback(async () => {
    // if (!backupConfirmed) {
    //   toast.error("Please confirm you have backed up your seed phrase");
    //   return;
    // }
    // try {
    //   setIsProcessingKeystore(true);
    //   toast.info("Creating keystore and connecting wallet...");
    //   const password = form.getValues("password");
    //   await createKeystore(generatedPhrase, password);
    //   setCurrentStep("3");
    //   toast.success("Keystore created and wallet connected successfully!");
    // } catch {
    //   toast.error(keystoreError || "Failed to create keystore");
    // } finally {
    //   setIsProcessingKeystore(false);
    // }
  }, []);

  const handleConnectKeystore = useCallback(async () => {
    // if (!keystoreGenerated) {
    //   toast.error("No keystore generated");
    //   return;
    // }
    // setIsConnectKeystoreLoading(true);
    // try {
    //   clearKeystoreError();
    //   const chains = [Chain.THORChain, Chain.Maya];
    //   // Import phrase and connect (phrase never stored in state)
    //   await connectKeystoreWallet(generatedPhrase, chains);
    //   toast.success("Wallet imported and connected successfully!");
    //   onConnect();
    // } catch {
    //   toast.error(keystoreError || "Failed to import seed phrase");
    // } finally {
    //   setIsConnectKeystoreLoading(false);
    // }
  }, []);

  const _handleDownload = useCallback(() => {
    // if (keystoreGenerated) {
    //   downloadKeystore(keystoreGenerated.keystore, keystoreGenerated.filename);
    //   toast.success("Keystore file downloaded successfully");
    // }
  }, []);

  const canGoBack = currentStep !== "1";
  const canContinue = (currentStep === "2" && backupConfirmed) || currentStep === "3";

  const isCreatingKeystore = false;

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create keystore wallet</DialogTitle>
        </DialogHeader>

        {/* {keystoreError && (
        <div className="mx-6 mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-red-300 text-sm">{keystoreError}</p>
        </div>
      )} */}

        <div className="flex flex-col pt-4">
          {/* <Separator /> */}

          <div className="flex items-center justify-between px-6 py-4">
            {canGoBack ? (
              <Button
                disabled={isCreatingKeystore}
                onClick={() => {
                  if (currentStep === "2") {
                    setCurrentStep("1");
                    setGeneratedPhrase("");
                    setBackupConfirmed(false);
                  } else if (currentStep === "3") {
                    setCurrentStep("2");
                  }
                }}
                variant="outline">
                Back
              </Button>
            ) : (
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
            )}

            {currentStep === "1" && (
              <Button
                disabled={isGeneratingPhrase}
                isLoading={isGeneratingPhrase}
                onClick={onPasswordSubmit}
                variant="primary">
                Generate Seed Phrase
              </Button>
            )}

            {currentStep === "2" && (
              <Button
                disabled={!canContinue}
                isLoading={isCreatingKeystore}
                onClick={handleCreateKeystore}
                variant="primary">
                Create Keystore
              </Button>
            )}

            {currentStep === "3" && (
              <Button
                isLoading={isConnectKeystoreLoading}
                onClick={form.handleSubmit(handleConnectKeystore)}
                variant="primary">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
