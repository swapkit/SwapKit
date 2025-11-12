"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Keystore } from "@swapkit/wallet-keystore";
import { CheckIcon, UploadIcon } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { match } from "ts-pattern";
import { z } from "zod";
import { cn } from "../../../lib/utils";
import { useModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const keystoreSchema = z.object({
  keystoreFile: z.custom<FileList>().refine((files) => files?.length === 1, "File required"),
  password: z.string().min(1, "Password is required"),
});

type KeystoreFormData = z.infer<typeof keystoreSchema>;

export function WalletKeystoreConnectDialog() {
  const modal = useModal();

  const fileInputId = useId();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const { keystoreFile, isKeystoreDecrypting, setKeystoreFile } = useSwapKit();

  const form = useForm<KeystoreFormData>({ defaultValues: { password: "" }, resolver: zodResolver(keystoreSchema) });

  const uploadedFiles = form.watch("keystoreFile");
  const selectedFile = uploadedFiles?.[0];

  const canContinue =
    (currentStep === 1 && Boolean(selectedFile)) || (currentStep === 2 && form.formState.isValid) || currentStep === 3;

  return (
    <Dialog {...modal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect keystore wallet</DialogTitle>
        </DialogHeader>

        <Tabs
          onValueChange={(newValue) => setCurrentStep(Number.parseInt(newValue, 10) as 1 | 2 | 3)}
          value={currentStep.toString()}>
          <TabsList className="h-fit w-full gap-2 bg-transparent p-0">
            <TabsTrigger className={cn(currentStep > 1 && "bg-accent")} value="1" variant="stepper" />
            <TabsTrigger className={cn(currentStep > 2 && "bg-accent")} value="2" variant="stepper" />
            <TabsTrigger className={cn(currentStep > 3 && "bg-accent")} value="3" variant="stepper" />
          </TabsList>

          <TabsContent value="1">
            <div className="flex flex-col gap-4">
              <span className="text-sm text-white text-opacity-65">
                Upload your keystore file to connect your wallet
              </span>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-secondary-hover-text text-sm">Keystore file</span>
                <label
                  className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-white border-dashed border-opacity-25 transition-colors hover:border-opacity-40 ${selectedFile ? "border-green-500 border-opacity-50 bg-green-500/5" : ""} `}
                  htmlFor={fileInputId}>
                  <div className="flex flex-col items-center gap-2">
                    {selectedFile ? (
                      <>
                        <CheckIcon className="h-6 w-6 text-green-500" />
                        <span className="font-medium text-green-400 text-sm">{selectedFile.name}</span>
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
                  type="file"
                  {...form.register("keystoreFile")}
                />
              </div>

              {selectedFile && (
                <div className="text-muted-foreground text-xs">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="2">
            <div className="mt-4 flex flex-col gap-4">
              <span className="text-sm text-white text-opacity-65">Enter the password for your keystore file</span>

              {keystoreFile && (
                <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-300 text-sm">Keystore file: {keystoreFile?.file.name}</span>
                  </div>
                </div>
              )}

              {/* <Form {...form}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          disabled={isKeystoreDecrypting}
                          error={Boolean(fieldState.error)}
                          placeholder="Enter keystore password..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form> */}
            </div>
          </TabsContent>

          <TabsContent value="3">
            <div className="mt-4 flex flex-col gap-4 text-center">
              <div className="rounded-md border border-green-500/20 bg-green-500/10 p-4">
                <CheckIcon className="mx-auto mb-2 h-8 w-8 text-green-500" />
                <h3 className="mb-1 font-medium text-green-300">Wallet Connected Successfully!</h3>
                <p className="text-muted-foreground text-sm">Your keystore wallet is now connected and ready to use.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {match(currentStep)
            .with(1, () => (
              <>
                <Button
                  disabled={isKeystoreDecrypting}
                  onClick={() => {
                    modal.resolve({ confirmed: false });
                  }}>
                  Cancel
                </Button>

                <Button
                  disabled={!canContinue}
                  onClick={() => {
                    if (!selectedFile) return;

                    setKeystoreFile({ chains: [], file: selectedFile, keystore: {} as Keystore });
                    setCurrentStep(2);
                  }}
                  variant="primary">
                  Upload File
                </Button>
              </>
            ))
            .with(2, () => (
              <>
                <Button
                  disabled={isKeystoreDecrypting}
                  onClick={() => {
                    setCurrentStep(1);
                  }}>
                  Back
                </Button>

                <Button disabled={!canContinue} isLoading={isKeystoreDecrypting} variant="primary">
                  Connect Wallet
                </Button>
              </>
            ))
            .with(3, () => (
              <>
                <Button
                  disabled={isKeystoreDecrypting}
                  onClick={() => {
                    setCurrentStep(2);
                  }}>
                  Back
                </Button>

                <Button
                  disabled={isKeystoreDecrypting}
                  onClick={() => {
                    modal.resolve({ confirmed: true, data: { password: form.getValues("password") } });
                  }}>
                  Done
                </Button>
              </>
            ))
            .exhaustive()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
