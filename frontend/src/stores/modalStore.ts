import { create } from "zustand";

interface ModalEntry {
  isOpen: boolean;
  loading: boolean;
}

interface ModalStoreState {
  modals: Record<string, ModalEntry>;
  open: (key: string) => void;
  close: (key: string) => void;
  setLoading: (key: string, loading: boolean) => void;
}

const useModalStore = create<ModalStoreState>((set) => ({
  modals: {},
  open: (key) =>
    set((state) => ({
      modals: { ...state.modals, [key]: { isOpen: true, loading: false } },
    })),
  close: (key) =>
    set((state) => ({
      modals: { ...state.modals, [key]: { isOpen: false, loading: false } },
    })),
  setLoading: (key, loading) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [key]: { ...state.modals[key], isOpen: state.modals[key]?.isOpen ?? false, loading },
      },
    })),
}));

export function useModal(key: string) {
  const modal = useModalStore((s) => s.modals[key]);
  const open = useModalStore((s) => s.open);
  const close = useModalStore((s) => s.close);
  const setLoading = useModalStore((s) => s.setLoading);

  return {
    isOpen: modal?.isOpen ?? false,
    loading: modal?.loading ?? false,
    open: () => open(key),
    close: () => close(key),
    setLoading: (v: boolean) => setLoading(key, v),
  };
}

export default useModalStore;
