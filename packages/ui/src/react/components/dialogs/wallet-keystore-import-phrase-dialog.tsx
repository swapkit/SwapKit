"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const phraseSchema = z
  .object({
    confirmPassword: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    seedPhrase: z
      .string()
      .min(1, "Seed phrase is required")
      .refine((value) => {
        const words = value.trim().split(/\s+/);
        return words.length === 12 || words.length === 24;
      }, "Seed phrase must be 12 or 24 words"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ImportPhraseFormData = z.infer<typeof phraseSchema>;

export const WalletKeystoreImportPhraseDialog = ({ onConnect }: { onConnect: () => void }) => {
  const modal = useModal();
  const [currentStep, setCurrentStep] = useState("1");
  const [isConnectKeystoreLoading, _setIsConnectKeystoreLoading] = useState(false);

  const {
    // validateSeedPhrase,
    // importPhraseAndCreate,
    // connectKeystoreWallet,
    // downloadKeystore,
    // keystoreError,
    // keystoreGenerated,
    // isCreatingKeystore,
    // clearKeystoreError,
  } = useSwapKit();

  const form = useForm<ImportPhraseFormData>({
    defaultValues: { confirmPassword: "", password: "", seedPhrase: "" },
    resolver: zodResolver(phraseSchema),
  });

  const watchedSeedPhrase = form.watch("seedPhrase");
  const wordCount = useMemo(() => watchedSeedPhrase.trim().split(/\s+/).filter(Boolean).length, [watchedSeedPhrase]);

  const onImportPhraseSubmit = () => {
    const { password, confirmPassword } = form.getValues();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
    } else {
      // void form.handleSubmit(handleImportPhrase)();
    }
  };

  // const handleImportPhrase = useCallback(async (data: ImportPhraseFormData) => {
  //   try {
  //     clearKeystoreError();

  //     // Validate the seed phrase format
  //     const isValid = await validateSeedPhrase(data.seedPhrase.trim());
  //     if (!isValid) {
  //       toast.error("Invalid seed phrase format. Please check your words.");
  //       return;
  //     }

  //     await importPhraseAndCreate(data.seedPhrase.trim(), data.password);
  //     setCurrentStep("2");

  //     toast.success("Wallet imported and connected successfully!");
  //   } catch {
  //     toast.error(keystoreError || "Failed to import seed phrase");
  //   }
  // }, []);

  // const handleConnectKeystore = useCallback(
  //   async (data: ImportPhraseFormData) => {
  //     setIsConnectKeystoreLoading(true);
  //     try {
  //       clearKeystoreError();

  //       const chains = [Chain.THORChain, Chain.Maya];

  //       // Import phrase and connect (phrase never stored in state)
  //       await connectKeystoreWallet(data.seedPhrase.trim(), chains);

  //       toast.success("Wallet imported and connected successfully!");
  //       onConnect();
  //     } catch {
  //       toast.error(keystoreError || "Failed to import seed phrase");
  //     } finally {
  //       setIsConnectKeystoreLoading(false);
  //     }
  //   },
  //   [onConnect],
  // );

  // const _handleDownload = useCallback(() => {
  //   if (keystoreGenerated) {
  //     downloadKeystore(keystoreGenerated.keystore, keystoreGenerated.filename);
  //     toast.success("Keystore file downloaded successfully");
  //   }
  // }, []);

  const _normalizeSeedPhrase = useCallback((value: string) => {
    // Remove extra spaces and convert to lowercase
    return value
      .toLowerCase()
      .replace(/[^a-z ]/g, "") // Only allow letters and spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trimStart(); // Remove leading spaces
  }, []);

  const _isValidWordCount = useMemo(() => wordCount === 12 || wordCount === 24, [wordCount]);

  const isCreatingKeystore = false;

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import seed phrase</DialogTitle>
        </DialogHeader>

        {/* {keystoreError && (
        <div className="mx-6 mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-red-300 text-sm">{keystoreError}</p>
        </div>
      )} */}

        <div className="flex flex-col pt-4">
          <div className="flex items-center justify-between px-6 py-4">
            {currentStep === "1" ? (
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
            ) : (
              <Button disabled={isCreatingKeystore} onClick={() => setCurrentStep("1")}>
                Back
              </Button>
            )}

            {currentStep === "1" && (
              <Button isLoading={isCreatingKeystore} onClick={onImportPhraseSubmit} variant="primary">
                Import & Connect
              </Button>
            )}

            {currentStep === "2" && (
              <DialogClose>
                <Button
                  isLoading={isConnectKeystoreLoading}
                  // onClick={form.handleSubmit(handleConnectKeystore)}
                  variant="primary">
                  Done
                </Button>
              </DialogClose>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
