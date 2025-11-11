import { useState } from "react";
import { match } from "ts-pattern";
import { useModal } from "../../../hooks/use-modal";
import { Dialog } from "../../ui/dialog";
import { CreateKeystoreDialogContent } from "./CreateKeystoreDialogContent";
import { ImportPhraseDialogContent } from "./ImportPhraseDialogContent";
import { KeystoreDialogContent } from "./KeystoreDialogContent";

export const WalletConnectKeystoreDialog = () => {
  const modal = useModal();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  return (
    <Dialog {...modal}>
      {match(currentStep)
        .with(1, () => <CreateKeystoreDialogContent onConnect={() => setCurrentStep(2)} />)
        .with(2, () => <ImportPhraseDialogContent onConnect={() => setCurrentStep(3)} />)
        .with(3, () => <KeystoreDialogContent onConnect={() => modal.resolve({ confirmed: true, data: undefined })} />)
        .exhaustive()}
    </Dialog>
  );
};
