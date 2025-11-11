import { zodResolver } from "@hookform/resolvers/zod";
import { Chain } from "@swapkit/sdk";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSwapKit } from "../../../swapkit-context";
import { Button } from "../../ui/button";
import { DialogClose, DialogContent } from "../../ui/dialog";

// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
// import { PasswordInput } from "../../ui/password-input";
// import { Separator } from "../../ui/separator";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
// import { Textarea } from "../../ui/textarea";

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

export const ImportPhraseDialogContent = ({ onConnect }: { onConnect: () => void }) => {
  const [currentStep, setCurrentStep] = useState("1");
  const [isConnectKeystoreLoading, setIsConnectKeystoreLoading] = useState(false);

  const {
    validateSeedPhrase,
    importPhraseAndCreate,
    connectKeystoreWallet,
    downloadKeystore,
    keystoreError,
    keystoreGenerated,
    isCreatingKeystore,
    clearKeystoreError,
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
      void form.handleSubmit(handleImportPhrase)();
    }
  };

  const handleImportPhrase = useCallback(
    async (data: ImportPhraseFormData) => {
      try {
        clearKeystoreError();

        // Validate the seed phrase format
        const isValid = await validateSeedPhrase(data.seedPhrase.trim());
        if (!isValid) {
          toast.error("Invalid seed phrase format. Please check your words.");
          return;
        }

        await importPhraseAndCreate(data.seedPhrase.trim(), data.password);
        setCurrentStep("2");

        toast.success("Wallet imported and connected successfully!");
      } catch {
        toast.error(keystoreError || "Failed to import seed phrase");
      }
    },
    [validateSeedPhrase, importPhraseAndCreate, keystoreError, clearKeystoreError],
  );

  const handleConnectKeystore = useCallback(
    async (data: ImportPhraseFormData) => {
      setIsConnectKeystoreLoading(true);
      try {
        clearKeystoreError();

        const chains = [Chain.THORChain, Chain.Maya];

        // Import phrase and connect (phrase never stored in state)
        await connectKeystoreWallet(data.seedPhrase.trim(), chains);

        toast.success("Wallet imported and connected successfully!");
        onConnect();
      } catch {
        toast.error(keystoreError || "Failed to import seed phrase");
      } finally {
        setIsConnectKeystoreLoading(false);
      }
    },
    [clearKeystoreError, connectKeystoreWallet, keystoreError, onConnect],
  );

  const _handleDownload = useCallback(() => {
    if (keystoreGenerated) {
      downloadKeystore(keystoreGenerated.keystore, keystoreGenerated.filename);
      toast.success("Keystore file downloaded successfully");
    }
  }, [keystoreGenerated, downloadKeystore]);

  const _normalizeSeedPhrase = useCallback((value: string) => {
    // Remove extra spaces and convert to lowercase
    return value
      .toLowerCase()
      .replace(/[^a-z ]/g, "") // Only allow letters and spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trimStart(); // Remove leading spaces
  }, []);

  const _isValidWordCount = useMemo(() => wordCount === 12 || wordCount === 24, [wordCount]);

  return (
    <DialogContent className="max-w-lg p-0">
      <span className="p-6 pb-0 font-medium text-secondary-hover-text text-xl">Import seed phrase</span>

      {/* <Tabs className="px-6" value={currentStep}>
        <TabsList className="h-fit w-full gap-2 bg-transparent p-0">
          <TabsTrigger value="1" variant="stepper" />
          <TabsTrigger value="2" variant="stepper" />
        </TabsList>

        <TabsContent value="1">
          <div className="mt-4 flex flex-col gap-4">
            <span className="text-sm text-white text-opacity-65">
              Enter your seed phrase and set a password for your new keystore file
            </span>

            <Form {...form}>
              <FormField
                control={form.control}
                name="seedPhrase"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Seed phrase</span>
                      <span
                        className={`text-xs ${
                          isValidWordCount
                            ? "text-green-400"
                            : wordCount > 0
                              ? "text-orange-400"
                              : "text-muted-foreground"
                        }`}>
                        {wordCount}/12 or 24 words
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className={"min-h-[100px] font-mono text-sm"}
                        error={!!fieldState.error}
                        onChange={(e) => {
                          const normalized = normalizeSeedPhrase(e.target.value);
                          field.onChange(normalized);
                        }}
                        placeholder="Enter your 12 or 24 word seed phrase..."
                      />
                    </FormControl>
                    <FormMessage />
                    {!fieldState.error && wordCount > 0 && !isValidWordCount && (
                      <p className="text-orange-400 text-xs">Seed phrases must be exactly 12 or 24 words</p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        error={Boolean(fieldState.error)}
                        placeholder="Enter password for keystore..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        error={Boolean(fieldState.error)}
                        placeholder="Confirm your password..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>

            <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 text-xs">ℹ️</span>
                <div className="text-blue-300 text-xs">
                  <p className="mb-1 font-medium">Import Process:</p>
                  <ul className="space-y-1 text-left">
                    <li>Your seed phrase will be validated</li>
                    <li>A new keystore file will be created</li>
                    <li>Your wallet will be connected automatically</li>
                    <li>You can download the keystore file for backup</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="2">
          <div className="mt-4 flex flex-col gap-4 text-center">
            <div className="rounded-md border border-green-500/20 bg-green-500/10 p-4">
              <CheckIcon className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <h3 className="mb-1 font-medium text-green-300">Import Successful!</h3>
              <p className="text-muted-foreground text-sm">Your wallet has been imported and connected successfully.</p>
            </div>

            {keystoreGenerated && (
              <Button className="w-full" onClick={handleDownload} variant="outline">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Keystore File
              </Button>
            )}

            <div className="rounded-md border border-orange-500/20 bg-orange-500/10 p-3">
              <div className="flex items-start gap-2">
                <span className="text-orange-500 text-xs">⚠️</span>
                <div className="text-orange-300 text-xs">
                  <p className="mb-1 text-left font-medium">Keep Your Keystore Safe:</p>
                  <ul className="space-y-1 text-left">
                    <li>Download and store your keystore file securely</li>
                    <li>Keep your original seed phrase safe as backup</li>
                    <li>Never share your keystore or seed phrase</li>
                  </ul>
                </div>
              </div>
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
          {currentStep === "1" ? (
            <DialogClose asChild>
              <Button className="text-base">Cancel</Button>
            </DialogClose>
          ) : (
            <Button className="text-base" disabled={isCreatingKeystore} onClick={() => setCurrentStep("1")}>
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
                onClick={form.handleSubmit(handleConnectKeystore)}
                variant="primary">
                Done
              </Button>
            </DialogClose>
          )}
        </div>
      </div>
    </DialogContent>
  );
};
