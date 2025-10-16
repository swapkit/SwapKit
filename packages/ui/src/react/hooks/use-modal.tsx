import { createContext, useContext } from "react";
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
  const { id } = useContext(ModalContext);

  const modal = useModalStore.getState().modals.find((m) => m.id === id);

  return {
    defaultOpen: true,
    onOpenChange: (open: boolean) => !open && id && removeModal({ confirmed: false, id }),
    open: true,
    resolve: ({ confirmed, data }: { confirmed: boolean; data?: T }) => {
      removeModal({ confirmed, id });
      modal?._promise?.resolve?.({ confirmed, data });
    },
  };
}

export function showModal<T = unknown>(component: React.ReactNode): Promise<{ confirmed: boolean; data?: T }> {
  return useModalStore.getState().addModal<T>(component);
}

const removeModal = ({ id, confirmed }: { id: string; confirmed: boolean }) => {
  const modal = useModalStore.getState().modals.find((m) => m.id === id);

  useModalStore.getState().removeModal(id);

  modal?._promise?.resolve?.({ confirmed });
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
