"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KEYSTORE_SUPPORTED_CHAINS, type Keystore } from "@swapkit/wallet-keystore";
import { CheckIcon, UploadIcon } from "lucide-react";
import { useCallback, useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "../../../lib/utils";
import { useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const step1Schema = z.object({
  currentStep: z.literal(1),
  keystoreFile: z.object({
    file: z.instanceof(File),
    keystore: z.object({
      crypto: z.object({
        cipher: z.string(),
        cipherparams: z.object({ iv: z.string() }),
        ciphertext: z.string(),
        kdf: z.string(),
        kdfparams: z.object({ c: z.number(), dklen: z.number(), prf: z.string(), salt: z.string() }),
        mac: z.string(),
      }),
      meta: z.string(),
      version: z.number(),
    }),
  }),
  password: z.string(),
});

const step2Schema = step1Schema.extend({
  currentStep: z.literal(2),
  password: z.string().min(1, "Password is required"),
});

const step3Schema = step2Schema.extend({ currentStep: z.literal(3) });

const keystoreSchema = z.discriminatedUnion("currentStep", [step1Schema, step2Schema, step3Schema]);

type KeystoreFormData = z.infer<typeof keystoreSchema>;

export function WalletKeystoreConnectDialog() {
  const modal = useModal();
  const fileInputId = useId();
  const { connectKeystore, isConnectingWallet } = useSwapKit();

  const form = useForm<KeystoreFormData>({
    defaultValues: { currentStep: 1, keystoreFile: { file: undefined, keystore: undefined }, password: "" },
    resolver: zodResolver(keystoreSchema),
  });

  const handleConnectWallet = form.handleSubmit(async (data) => {
    if (!data?.password) return;

    try {
      await connectKeystore({ ...data?.keystoreFile, chains: KEYSTORE_SUPPORTED_CHAINS }, data?.password);

      form.setValue("currentStep", 3);
    } catch {
      form.setError("password", { message: "You used an incorrect password or something went wrong." });
    }
  });

  const handleKeystoreFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const keystoreFile = e?.target?.files?.[0];

      if (!keystoreFile) return;

      try {
        form.setValue(
          "keystoreFile",
          { file: keystoreFile, keystore: JSON.parse(await keystoreFile.text()) as Keystore },
          { shouldValidate: true },
        );
      } catch (error) {
        console.error("Error parsing keystore file:", error);
        toast.error("Something went wrong while parsing the keystore file", {
          description: "Please check if the file is a valid keystore file",
        });
      }
    },
    [form],
  );

  const [currentStep, keystoreFile] = form.watch(["currentStep", "keystoreFile"]);

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect keystore wallet</DialogTitle>
        </DialogHeader>

        <Tabs
          onValueChange={(newValue) => form.setValue("currentStep", Number.parseInt(newValue, 10) as 1 | 2 | 3)}
          value={currentStep.toString()}>
          <TabsList className="sk-ui-w-full sk-ui-gap-2 sk-ui-h-auto sk-ui-p-0">
            <TabsTrigger className={cn(currentStep > 1 && "!sk-ui-bg-accent")} value="1" variant="stepper" />
            <TabsTrigger className={cn(currentStep > 2 && "!sk-ui-bg-accent")} value="2" variant="stepper" />
            <TabsTrigger className={cn(currentStep >= 3 && "!sk-ui-bg-accent")} value="3" variant="stepper" />
          </TabsList>

          <TabsContent value="1">
            <form
              onSubmit={form.handleSubmit(() => {
                form.setValue("currentStep", 2);
              })}>
              <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-4">
                <span className="sk-ui-text-sm sk-ui-text-white sk-ui-text-opacity-65">
                  Upload your keystore file to connect your wallet
                </span>

                <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-2">
                  <span className="sk-ui-font-medium sk-ui-text-secondary-hover-text sk-ui-text-sm">Keystore file</span>
                  <label
                    className={cn(
                      "sk-ui-flex sk-ui-h-24 sk-ui-w-full sk-ui-cursor-pointer sk-ui-flex-col sk-ui-items-center sk-ui-justify-center sk-ui-rounded-md sk-ui-border-2 sk-ui-border-white sk-ui-border-dashed sk-ui-border-opacity-25 sk-ui-transition-colors hover:sk-ui-border-opacity-40",
                      keystoreFile?.file && "sk-ui-border-opacity-50 sk-ui-bg-green-500/5 sk-ui-border-green-500",
                    )}
                    htmlFor={fileInputId}>
                    <div className="sk-ui-flex sk-ui-flex-col sk-ui-items-center sk-ui-gap-2">
                      {keystoreFile?.file ? (
                        <>
                          <CheckIcon className="sk-ui-h-6 sk-ui-w-6 sk-ui-text-green-500" />
                          <span className="sk-ui-font-medium sk-ui-text-green-400 sk-ui-text-sm">
                            {keystoreFile?.file?.name}
                          </span>
                          <span className="sk-ui-text-muted-foreground sk-ui-text-xs">
                            Click to select a different file
                          </span>
                        </>
                      ) : (
                        <>
                          <UploadIcon className="sk-ui-h-6 sk-ui-w-6 sk-ui-text-muted-foreground" />
                          <span className="sk-ui-font-medium sk-ui-text-sm">Choose keystore file</span>
                          <span className="sk-ui-text-muted-foreground sk-ui-text-xs">JSON files only</span>
                        </>
                      )}
                    </div>
                  </label>

                  <input
                    accept=".json,.txt,text/plain,application/json"
                    className="sk-ui-hidden"
                    id={fileInputId}
                    onChange={handleKeystoreFileChange}
                    type="file"
                  />
                </div>

                {keystoreFile?.file && (
                  <div className="sk-ui-text-muted-foreground sk-ui-text-xs">
                    Selected: {keystoreFile?.file?.name} ({(keystoreFile?.file?.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <DialogFooter className="sk-ui-mt-4">
                <Button onClick={() => modal.resolve({ confirmed: false })} type="button">
                  Cancel
                </Button>

                <Button
                  disabled={!form?.formState?.isValid || form?.formState?.isSubmitting}
                  isLoading={form?.formState?.isSubmitting}
                  type="submit"
                  variant="primary">
                  Upload File
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="2">
            <form onSubmit={handleConnectWallet}>
              <div className="sk-ui-mt-4 sk-ui-flex sk-ui-flex-col sk-ui-gap-4">
                <span className="sk-ui-text-sm sk-ui-text-white sk-ui-text-opacity-65">
                  Enter the password for your keystore file
                </span>

                {keystoreFile?.file && (
                  <div className="sk-ui-rounded-md sk-ui-border sk-ui-border-blue-500/20 sk-ui-bg-blue-500/10 sk-ui-p-3">
                    <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
                      <CheckIcon className="sk-ui-h-4 sk-ui-w-4 sk-ui-text-blue-400" />
                      <span className="sk-ui-text-blue-300 sk-ui-text-sm">
                        Keystore file: {keystoreFile?.file?.name}
                      </span>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>

                        <FormControl>
                          <Input
                            {...field}
                            autoFocus
                            disabled={isConnectingWallet}
                            placeholder="Enter keystore password..."
                            type="password"
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </div>

              <DialogFooter className="sk-ui-mt-4">
                <Button onClick={() => form.setValue("currentStep", 1)} type="button">
                  Go Back
                </Button>

                <Button
                  disabled={!form?.formState?.isValid || form?.formState?.isSubmitting}
                  isLoading={form?.formState?.isSubmitting}
                  type="submit"
                  variant="primary">
                  Connect Wallet
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent asChild value="3">
            <form
              onSubmit={form.handleSubmit(() => {
                modal.resolve({ confirmed: true, data: undefined });
              })}>
              <div className="sk-ui-mt-4 sk-ui-flex sk-ui-flex-col sk-ui-gap-4 sk-ui-text-center">
                <div className="sk-ui-rounded-md sk-ui-border sk-ui-border-green-500/20 sk-ui-bg-green-500/10 sk-ui-p-4">
                  <CheckIcon className="sk-ui-mx-auto sk-ui-mb-2 sk-ui-h-8 sk-ui-w-8 sk-ui-text-green-500" />
                  <h3 className="sk-ui-mb-1 sk-ui-font-medium sk-ui-text-green-300">Wallet Connected Successfully!</h3>
                  <p className="sk-ui-text-muted-foreground sk-ui-text-sm">
                    Your keystore wallet is now connected and ready to use.
                  </p>
                </div>
              </div>

              <DialogFooter className="sk-ui-mt-4">
                <Button onClick={() => form.setValue("currentStep", 2)} type="button">
                  Go Back
                </Button>

                <Button type="submit" variant="primary">
                  Done
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
