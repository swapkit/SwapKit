import { createContext, useContext, useState } from "react";
import { create } from "zustand";

export const useModalStore = create<{
  modals: {
    id: string;
    component: React.ReactNode;
    _promise: {
      promise: Promise<{ confirmed: boolean; data?: unknown }>;
      resolve: (value?: { confirmed: boolean; data?: unknown }) => void;
    };
  }[];
  addModal: <T = unknown>(component: React.ReactNode) => Promise<{ confirmed: boolean; data?: T }>;
  removeModal: (id: string) => void;
}>((set) => ({
  addModal<T = unknown>(component: React.ReactNode): Promise<{ confirmed: boolean; data?: T }> {
    const { resolve, promise } = Promise.withResolvers<{ confirmed: boolean }>();

    set((state) => {
      return { modals: [...state.modals, { _promise: { promise, resolve }, component, id: crypto.randomUUID() }] };
    });

    return promise as Promise<{ confirmed: boolean; data?: T }>;
  },
  modals: [],
  removeModal: (id: string) => set((state) => ({ modals: state.modals.filter((m) => m.id !== id) })),
}));

export function useModal<T = unknown>() {
  const defaultOpen = true;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { id } = useContext(ModalContext);

  const modal = useModalStore.getState().modals.find((m) => m.id === id);

  const resolve = ({ confirmed, data }: { confirmed: boolean; data?: T }) => {
    modal?._promise?.resolve?.({ confirmed, data });
    setIsOpen(false);

    setTimeout(() => {
      removeModal({ id });
    }, 200);
  };

  return {
    defaultOpen,
    onOpenChange: (open: boolean) => {
      if (open) {
        setIsOpen(true);
        return;
      }

      resolve({ confirmed: false });
    },
    open: isOpen,
    resolve,
  };
}

export function showModal<T = unknown>(component: React.ReactNode): Promise<{ confirmed: boolean; data?: T }> {
  return useModalStore.getState().addModal<T>(component);
}

const removeModal = ({ id }: { id: string }) => {
  const modal = useModalStore.getState().modals.find((m) => m.id === id);

  if (!modal) return;

  useModalStore.getState().removeModal(id);
};

const ModalContext = createContext<{ id: string }>({ id: "" });

export const ModalSpawner = () => {
  const { modals } = useModalStore();

  return modals?.map((modal) => {
    return (
      <ModalContext.Provider key={modal.id} value={{ id: modal.id }}>
        {modal.component}
      </ModalContext.Provider>
    );
  });
};
