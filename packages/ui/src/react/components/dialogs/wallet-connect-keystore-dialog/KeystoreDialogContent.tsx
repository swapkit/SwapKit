import { zodResolver } from "@hookform/resolvers/zod";
import { Chain } from "@swapkit/helpers";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSwapKit } from "../../../swapkit-context";
import { Button } from "../../ui/button";
import { DialogClose, DialogContent } from "../../ui/dialog";

// import { Separator } from "../../ui/separator";

const keystoreSchema = z.object({
  keystoreFile: z.custom<FileList>().refine((files) => files?.length === 1, "File required"),
  password: z.string().min(1, "Password is required"),
});

type KeystoreFormData = z.infer<typeof keystoreSchema>;

export const KeystoreDialogContent = ({ onConnect }: { onConnect: () => void }) => {
  const [currentStep, setCurrentStep] = useState("1");

  const {
    handleKeystoreFileUpload,
    connectKeystoreWallet,
    keystoreFile,
    keystoreError,
    isKeystoreDecrypting,
    setIsKeystoreDecrypting,
    clearKeystoreError,
  } = useSwapKit();

  const { decryptFromKeystore: workerDecryptFromKeystore, isReady: isWorkerReady } = useKeystoreWorker?.() ?? {};

  const form = useForm<KeystoreFormData>({ defaultValues: { password: "" }, resolver: zodResolver(keystoreSchema) });

  const { register, watch } = form;
  const uploadedFiles = watch("keystoreFile") ?? [];
  const selectedFile = uploadedFiles[0];

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please select a keystore file");
      return;
    }

    try {
      clearKeystoreError();
      const chains = [Chain.THORChain, Chain.Maya];
      await handleKeystoreFileUpload(selectedFile, chains);
      setCurrentStep("2");

      toast.success("Keystore file uploaded successfully");
    } catch {
      toast.error("Failed to upload keystore file");
    }
  }, [selectedFile, handleKeystoreFileUpload, clearKeystoreError]);

  const handleConnect = useCallback(
    async (data: KeystoreFormData) => {
      if (!keystoreFile) {
        toast.error("No keystore file uploaded");
        return;
      }

      setIsKeystoreDecrypting(true);
      clearKeystoreError();
      try {
        // Decrypt keystore to get phrase using worker if available, fallback to main thread
        let phrase: string;
        if (isWorkerReady) {
          phrase = await workerDecryptFromKeystore(keystoreFile.keystore, data.password);
        } else {
          const { decryptFromKeystore } = await import("@swapkit/wallets/keystore");
          phrase = await decryptFromKeystore(keystoreFile.keystore, data.password);
        }

        if (!phrase) {
          throw new Error("Failed to decrypt keystore");
        }

        // Connect wallet using the phrase (phrase cleared after this call)
        await connectKeystoreWallet(phrase, keystoreFile.chains);
        setCurrentStep("3");

        toast.success("Wallet connected successfully!");
        onConnect();
      } catch {
        toast.error(keystoreError || "Failed to decrypt keystore or connect wallet.\nPlease check your password.");
      } finally {
        setIsKeystoreDecrypting(false);
      }
    },
    [
      keystoreFile,
      connectKeystoreWallet,
      clearKeystoreError,
      keystoreError,
      onConnect,
      setIsKeystoreDecrypting,
      isWorkerReady,
      workerDecryptFromKeystore,
    ],
  );

  const canContinue =
    (currentStep === "1" && Boolean(selectedFile)) ||
    (currentStep === "2" && form.formState.isValid) ||
    currentStep === "3";

  const canGoBack = currentStep !== "1";

  return (
    <DialogContent className="max-w-lg p-0">
      <span className="p-6 pb-0 font-medium text-secondary-hover-text text-xl">Connect keystore wallet</span>

      {/* <Tabs value={currentStep} className="px-6">
        <TabsList className="h-fit w-full gap-2 bg-transparent p-0">
          <TabsTrigger variant="stepper" value="1" />
          <TabsTrigger variant="stepper" value="2" />
          <TabsTrigger variant="stepper" value="3" />
        </TabsList>

        <TabsContent value="1">
          <div className="mt-4 flex flex-col gap-4">
            <span className="text-sm text-white text-opacity-65">
              Upload your keystore file to connect your wallet
            </span>

            <div className="flex flex-col gap-2">
              <span className="text-secondary-hover-text text-sm font-medium">
                Keystore file
              </span>
              <label
                htmlFor="files"
                className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-white border-opacity-25 transition-colors hover:border-opacity-40 ${selectedFile ? "border-green-500 border-opacity-50 bg-green-500/5" : ""} `}
              >
                <div className="flex flex-col items-center gap-2">
                  {selectedFile ? (
                    <>
                      <CheckIcon className="h-6 w-6 text-green-500" />
                      <span className="text-sm font-medium text-green-400">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Click to select a different file
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Choose keystore file
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JSON files only
                      </span>
                    </>
                  )}
                </div>
              </label>
              <input
                id="files"
                type="file"
                className="hidden"
                accept=".json,.txt,text/plain,application/json"
                {...register("keystoreFile")}
              />
            </div>

            {selectedFile && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="2">
          <div className="mt-4 flex flex-col gap-4">
            <span className="text-sm text-white text-opacity-65">
              Enter the password for your keystore file
            </span>

            {keystoreFile && (
              <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-blue-300">
                    Keystore file: {keystoreFile.file.name}
                  </span>
                </div>
              </div>
            )}

            <Form {...form}>
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Enter keystore password..."
                        error={Boolean(fieldState.error)}
                        disabled={isKeystoreDecrypting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        </TabsContent>

        <TabsContent value="3">
          <div className="mt-4 flex flex-col gap-4 text-center">
            <div className="rounded-md border border-green-500/20 bg-green-500/10 p-4">
              <CheckIcon className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <h3 className="mb-1 font-medium text-green-300">
                Wallet Connected Successfully!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your keystore wallet is now connected and ready to use.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs> */}

      {keystoreError && (
        <div className="mx-6 mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-red-300 text-sm">{keystoreError}</p>
        </div>
      )}

      <div className="flex flex-col pt-4">
        {/* <Separator /> */}

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
              <Button className="text-base">Cancel</Button>
            </DialogClose>
          )}

          {currentStep === "1" && (
            <Button className="text-base" disabled={!canContinue} onClick={handleFileUpload} variant="primary">
              Upload File
            </Button>
          )}

          {currentStep === "2" && (
            <Button
              className="text-base"
              disabled={!canContinue}
              isLoading={isKeystoreDecrypting}
              onClick={form.handleSubmit(handleConnect)}
              variant="primary">
              Connect Wallet
            </Button>
          )}

          {currentStep === "3" && (
            <DialogClose asChild>
              <Button className="text-base" variant="primary">
                Done
              </Button>
            </DialogClose>
          )}
        </div>
      </div>
    </DialogContent>
  );
};
