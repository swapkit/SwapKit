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
          <TabsList className="h-fit w-full gap-2 bg-transparent p-0">
            <TabsTrigger className={cn(currentStep > 1 && "bg-accent")} value="1" variant="stepper" />
            <TabsTrigger className={cn(currentStep > 2 && "bg-accent")} value="2" variant="stepper" />
            <TabsTrigger className={cn(currentStep >= 3 && "!bg-accent")} value="3" variant="stepper" />
          </TabsList>

          <TabsContent value="1">
            <form
              onSubmit={form.handleSubmit(() => {
                form.setValue("currentStep", 2);
              })}>
              <div className="flex flex-col gap-4">
                <span className="text-sm text-white text-opacity-65">
                  Upload your keystore file to connect your wallet
                </span>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-secondary-hover-text text-sm">Keystore file</span>
                  <label
                    className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-white border-dashed border-opacity-25 transition-colors hover:border-opacity-40 ${keystoreFile?.file ? "border-green-500 border-opacity-50 bg-green-500/5" : ""} `}
                    htmlFor={fileInputId}>
                    <div className="flex flex-col items-center gap-2">
                      {keystoreFile?.file ? (
                        <>
                          <CheckIcon className="h-6 w-6 text-green-500" />
                          <span className="font-medium text-green-400 text-sm">{keystoreFile?.file?.name}</span>
                          <span className="text-muted-foreground text-xs">Click to select a different file</span>
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-6 w-6 text-muted-foreground" />
                          <span className="font-medium text-sm">Choose keystore file</span>
                          <span className="text-muted-foreground text-xs">JSON files only</span>
                        </>
                      )}
                    </div>
                  </label>

                  <input
                    accept=".json,.txt,text/plain,application/json"
                    className="hidden"
                    id={fileInputId}
                    onChange={handleKeystoreFileChange}
                    type="file"
                  />
                </div>

                {keystoreFile?.file && (
                  <div className="text-muted-foreground text-xs">
                    Selected: {keystoreFile?.file?.name} ({(keystoreFile?.file?.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button onClick={() => modal.resolve({ confirmed: false })} type="button">
                  Cancel
                </Button>

                <Button
                  disabled={!form?.formState?.isValid}
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
              <div className="mt-4 flex flex-col gap-4">
                <span className="text-sm text-white text-opacity-65">Enter the password for your keystore file</span>

                {keystoreFile?.file && (
                  <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300 text-sm">Keystore file: {keystoreFile?.file?.name}</span>
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

              <DialogFooter className="mt-4">
                <Button onClick={() => form.setValue("currentStep", 1)} type="button">
                  Go Back
                </Button>

                <Button
                  disabled={!form?.formState?.isValid}
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
              <div className="mt-4 flex flex-col gap-4 text-center">
                <div className="rounded-md border border-green-500/20 bg-green-500/10 p-4">
                  <CheckIcon className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <h3 className="mb-1 font-medium text-green-300">Wallet Connected Successfully!</h3>
                  <p className="text-muted-foreground text-sm">
                    Your keystore wallet is now connected and ready to use.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button onClick={() => form.setValue("currentStep", 2)} type="button">
                  Go Back
                </Button>

                <Button type="submit">Done</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
