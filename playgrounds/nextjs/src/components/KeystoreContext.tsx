"use client";

import type { Keystore } from "@swapkit/wallet-keystore";
import { type ReactNode, createContext, useContext, useState } from "react";

type KeystoreFile = {
  keystore: Keystore;
  file: File;
} | null;

interface KeystoreContextType {
  keystoreFile: KeystoreFile;
  setKeystoreFile: (file: KeystoreFile) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isDecrypting: boolean;
  setIsDecrypting: (decrypting: boolean) => void;
  onSubmit: ((password: string) => void) | null;
  setOnSubmit: (callback: ((password: string) => void) | null) => void;
  onCancel: (() => void) | null;
  setOnCancel: (callback: (() => void) | null) => void;
}

const KeystoreContext = createContext<KeystoreContextType | undefined>(undefined);

export function KeystoreProvider({ children }: { children: ReactNode }) {
  const [keystoreFile, setKeystoreFile] = useState<{ keystore: Keystore; file: File } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [onSubmit, setOnSubmit] = useState<((password: string) => void) | null>(null);
  const [onCancel, setOnCancel] = useState<(() => void) | null>(null);

  return (
    <KeystoreContext.Provider
      value={{
        keystoreFile,
        setKeystoreFile,
        isOpen,
        setIsOpen,
        isDecrypting,
        setIsDecrypting,
        onSubmit,
        setOnSubmit,
        onCancel,
        setOnCancel,
      }}
    >
      {children}
    </KeystoreContext.Provider>
  );
}

export function useKeystore() {
  const context = useContext(KeystoreContext);
  if (context === undefined) {
    throw new Error("useKeystore must be used within a KeystoreProvider");
  }
  return context;
}
