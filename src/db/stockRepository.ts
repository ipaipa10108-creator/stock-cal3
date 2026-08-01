import Dexie, { type Table } from 'dexie';
import type { Account, HoldingItem, HistoryItem, HoldingDisplaySettings } from '../types/stock';

export class StockDatabase extends Dexie {
  accounts!: Table<Account, string>;
  holdings!: Table<HoldingItem, string>;
  history!: Table<HistoryItem, string>;
  settings!: Table<{ id: string; value: any }, string>;

  constructor() {
    super('StockCal3DB');
    this.version(1).stores({
      accounts: 'id, name',
      holdings: 'id, symbol, date',
      history: 'id, symbol, sellDate',
      settings: 'id',
    });
  }
}

export const db = new StockDatabase();

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-default', name: '主要證券戶' },
  { id: 'acc-daytrade', name: '當沖專用戶' },
  { id: 'acc-temp', name: '臨時過渡戶' },
];

export const DEFAULT_SETTINGS: HoldingDisplaySettings = {
  showTickInfo: true,
  showEtfDiscount: true,
  showBreakEvenPrice: true,
  showFeeTaxDetails: true,
  showLotDetails: true,
  showActivityLogs: true,
  showMarginMaintenanceRatio: true,
};

export const StorageRepository = {
  async getAccounts(): Promise<Account[]> {
    try {
      const list = await db.accounts.toArray();
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Dexie read failed, reading from localStorage...', e);
    }
    const local = localStorage.getItem('stock_cal3_accounts');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return DEFAULT_ACCOUNTS;
  },

  async saveAccounts(accounts: Account[]): Promise<void> {
    try {
      await db.accounts.clear();
      await db.accounts.bulkAdd(accounts);
    } catch (e) {}
    localStorage.setItem('stock_cal3_accounts', JSON.stringify(accounts));
  },

  async getHoldings(accountId: string): Promise<HoldingItem[]> {
    const key = `stock_cal3_holdings_${accountId}`;
    const local = localStorage.getItem(key);
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [];
  },

  async saveHoldings(accountId: string, holdings: HoldingItem[]): Promise<void> {
    const key = `stock_cal3_holdings_${accountId}`;
    localStorage.setItem(key, JSON.stringify(holdings));
  },

  async getHistory(): Promise<HistoryItem[]> {
    const local = localStorage.getItem('stock_cal3_history');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [];
  },

  async saveHistory(history: HistoryItem[]): Promise<void> {
    localStorage.setItem('stock_cal3_history', JSON.stringify(history));
  },

  async getDiscount(): Promise<number> {
    const local = localStorage.getItem('stock_cal3_discount');
    return local ? parseFloat(local) : 0.38;
  },

  async saveDiscount(discount: number): Promise<void> {
    localStorage.setItem('stock_cal3_discount', discount.toString());
  },
};
