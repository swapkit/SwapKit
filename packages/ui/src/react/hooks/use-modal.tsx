import { createContext, useContext, useState } from "react";
import { create } from "zustand";

type ModalStore = {
  modals: {
    id: string;
    component: React.ReactNode;
    _promise: {
      promise: Promise<{ confirmed: true; data: unknown } | { confirmed: false; data?: never }>;
      resolve: <T>(value?: { confirmed: true; data: T } | { confirmed: false; data?: never }) => void;
    };
  }[];
  addModal: <T>(
    component: React.ReactNode,
  ) => Promise<{ confirmed: true; data: T } | { confirmed: false; data?: never }>;
  removeModal: (id: string) => void;
};

export const useModalStore = create<ModalStore>((set) => ({
  addModal<T>(component: React.ReactNode) {
    const { resolve, promise } = Promise.withResolvers<
      { confirmed: true; data: T } | { confirmed: false; data?: never }
    >();

    set((state) => {
      return {
        modals: [
          ...state.modals,
          {
            _promise: {
              promise,
              resolve: resolve as <T>(
                value?: { confirmed: true; data: T } | { confirmed: false; data?: never },
              ) => void,
            },
            component,
            id: crypto.randomUUID(),
          },
        ],
      };
    });

    return promise;
  },
  modals: [],
  removeModal: (id: string) => set((state) => ({ modals: state.modals.filter((m) => m.id !== id) })),
}));

export function useModal<T = unknown>() {
  const defaultOpen = true;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { id } = useContext(ModalContext);

  const modal = useModalStore.getState().modals.find((m) => m.id === id);

  function resolve({ confirmed, data }: { confirmed: true; data: T } | { confirmed: false; data?: never }) {
    if (!confirmed) {
      modal?._promise?.resolve?.({ confirmed: false, data: undefined });
    } else {
      modal?._promise?.resolve?.({ confirmed: true, data });
    }

    setIsOpen(false);

    setTimeout(() => {
      removeModal({ id });
    }, 200);
  }

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

export function showModal<T = unknown>(
  component: React.ReactNode,
): Promise<{ confirmed: true; data: T } | { confirmed: false; data?: never }> {
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
