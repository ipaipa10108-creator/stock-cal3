import type { StateCreator } from 'zustand';

export type ActiveTab = 'calculator' | 'holdings' | 'history' | 'market' | 'settings';

export interface UiSlice {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAddHoldingModalOpen: boolean;
  setIsAddHoldingModalOpen: (open: boolean) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  activeTab: 'calculator',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isAddHoldingModalOpen: false,
  setIsAddHoldingModalOpen: (open) => set({ isAddHoldingModalOpen: open }),

  isAccountModalOpen: false,
  setIsAccountModalOpen: (open) => set({ isAccountModalOpen: open }),

  isShareModalOpen: false,
  setIsShareModalOpen: (open) => set({ isShareModalOpen: open }),

  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },
});
