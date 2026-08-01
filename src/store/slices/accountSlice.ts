import type { StateCreator } from 'zustand';
import type { Account } from '../../types/stock';
import { DEFAULT_ACCOUNTS, StorageRepository } from '../../db/stockRepository';

export interface AccountSlice {
  accounts: Account[];
  currentAccountId: string;
  setAccounts: (accounts: Account[]) => void;
  setCurrentAccountId: (id: string) => void;
  addAccount: (name: string) => void;
  updateAccountName: (id: string, name: string) => void;
  deleteAccount: (id: string) => void;
}

export const createAccountSlice: StateCreator<AccountSlice, [], [], AccountSlice> = (set, get) => ({
  accounts: DEFAULT_ACCOUNTS,
  currentAccountId: 'acc-default',
  setAccounts: (accounts) => {
    set({ accounts });
    StorageRepository.saveAccounts(accounts);
  },
  setCurrentAccountId: (id) => {
    set({ currentAccountId: id });
  },
  addAccount: (name) => {
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: name.trim() || '新帳號',
    };
    const updated = [...get().accounts, newAcc];
    set({ accounts: updated, currentAccountId: newAcc.id });
    StorageRepository.saveAccounts(updated);
  },
  updateAccountName: (id, name) => {
    const updated = get().accounts.map(a => a.id === id ? { ...a, name } : a);
    set({ accounts: updated });
    StorageRepository.saveAccounts(updated);
  },
  deleteAccount: (id) => {
    if (get().accounts.length <= 1) return;
    const updated = get().accounts.filter(a => a.id !== id);
    const nextAccId = get().currentAccountId === id ? updated[0].id : get().currentAccountId;
    set({ accounts: updated, currentAccountId: nextAccId });
    StorageRepository.saveAccounts(updated);
  },
});
