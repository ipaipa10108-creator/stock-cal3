import type { StateCreator } from 'zustand';
import type { HoldingItem, HistoryItem, HoldingLot } from '../../types/stock';
import { StorageRepository } from '../../db/stockRepository';
import { cleanNum } from '../../utils/stockMath';

export interface HoldingsSlice {
  holdingsData: Record<string, HoldingItem[]>;
  historyData: HistoryItem[];
  globalDiscount: number;
  setGlobalDiscount: (discount: number) => void;
  loadInitialData: () => Promise<void>;
  addHolding: (accountId: string, holding: Omit<HoldingItem, 'id'>) => void;
  updateHolding: (accountId: string, holding: HoldingItem) => void;
  deleteHolding: (accountId: string, holdingId: string) => void;
  sellHolding: (
    accountId: string,
    holdingId: string,
    sellPrice: number,
    sellShares: number,
    sellDate: string
  ) => void;
  restoreHistoryItem: (accountId: string, historyId: string) => void;
  splitHoldingLots: (accountId: string, holdingId: string) => void;
  editHoldingLot: (
    accountId: string,
    holdingId: string,
    lotId: string,
    newBuyPrice: number,
    newShares: number,
    newDate: string
  ) => void;
}

export const createHoldingsSlice: StateCreator<HoldingsSlice, [], [], HoldingsSlice> = (set, get) => ({
  holdingsData: {},
  historyData: [],
  globalDiscount: 0.38,

  setGlobalDiscount: (discount) => {
    set({ globalDiscount: discount });
    StorageRepository.saveDiscount(discount);
  },

  loadInitialData: async () => {
    const history = await StorageRepository.getHistory();
    const discount = await StorageRepository.getDiscount();
    const accounts = await StorageRepository.getAccounts();

    const holdingsRecord: Record<string, HoldingItem[]> = {};
    for (const acc of accounts) {
      holdingsRecord[acc.id] = await StorageRepository.getHoldings(acc.id);
    }

    set({
      historyData: history,
      globalDiscount: discount,
      holdingsData: holdingsRecord,
    });
  },

  addHolding: (accountId, newHolding) => {
    const currentList = get().holdingsData[accountId] || [];
    
    const existingIndex = currentList.findIndex(h => h.symbol === newHolding.symbol && h.tradeType === newHolding.tradeType);

    let updatedList: HoldingItem[];

    if (existingIndex >= 0) {
      const existing = currentList[existingIndex];
      const newLot: HoldingLot = {
        id: `lot-${Date.now()}`,
        buyPrice: newHolding.buyPrice,
        shares: newHolding.shares,
        date: newHolding.date,
        tradeType: newHolding.tradeType,
      };

      const lots = existing.lots ? [...existing.lots, newLot] : [
        {
          id: `lot-${Date.now()}-1`,
          buyPrice: existing.buyPrice,
          shares: existing.shares,
          date: existing.date,
          tradeType: existing.tradeType,
        },
        newLot,
      ];

      const totalShares = lots.reduce((sum, l) => sum + l.shares, 0);
      const totalBuyCost = lots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
      const avgPrice = totalShares > 0 ? parseFloat((totalBuyCost / totalShares).toFixed(2)) : existing.buyPrice;

      const updatedItem: HoldingItem = {
        ...existing,
        shares: totalShares,
        buyPrice: avgPrice,
        currentPrice: newHolding.currentPrice > 0 ? newHolding.currentPrice : existing.currentPrice,
        lots,
      };

      updatedList = [...currentList];
      updatedList[existingIndex] = updatedItem;
    } else {
      const item: HoldingItem = {
        ...newHolding,
        id: `holding-${Date.now()}`,
        lots: [
          {
            id: `lot-${Date.now()}`,
            buyPrice: newHolding.buyPrice,
            shares: newHolding.shares,
            date: newHolding.date,
            tradeType: newHolding.tradeType,
          }
        ]
      };
      updatedList = [item, ...currentList];
    }

    const newRecord = { ...get().holdingsData, [accountId]: updatedList };
    set({ holdingsData: newRecord });
    StorageRepository.saveHoldings(accountId, updatedList);
  },

  updateHolding: (accountId, updatedHolding) => {
    const list = get().holdingsData[accountId] || [];
    const updatedList = list.map(h => h.id === updatedHolding.id ? updatedHolding : h);
    set({ holdingsData: { ...get().holdingsData, [accountId]: updatedList } });
    StorageRepository.saveHoldings(accountId, updatedList);
  },

  deleteHolding: (accountId, holdingId) => {
    const list = get().holdingsData[accountId] || [];
    const updatedList = list.filter(h => h.id !== holdingId);
    set({ holdingsData: { ...get().holdingsData, [accountId]: updatedList } });
    StorageRepository.saveHoldings(accountId, updatedList);
  },

  sellHolding: (accountId, holdingId, sellPrice, sellShares, sellDate) => {
    const list = get().holdingsData[accountId] || [];
    const holding = list.find(h => h.id === holdingId);
    if (!holding) return;

    const actualSellShares = Math.min(holding.shares, cleanNum(sellShares));
    if (actualSellShares <= 0) return;

    const buyPrice = holding.buyPrice;
    const realizedPnl = Math.round((sellPrice - buyPrice) * actualSellShares);
    const returnPct = parseFloat((((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2));

    const historyItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      symbol: holding.symbol,
      name: holding.name,
      buyPrice: holding.buyPrice,
      sellPrice,
      shares: actualSellShares,
      realizedPnl,
      returnPct,
      buyDate: holding.date,
      sellDate,
      tradeType: holding.tradeType,
      assetType: holding.assetType,
      discount: holding.discount,
      minFee: holding.minFee,
    };

    const newHistory = [historyItem, ...get().historyData];
    set({ historyData: newHistory });
    StorageRepository.saveHistory(newHistory);

    const remainingShares = holding.shares - actualSellShares;
    let updatedList: HoldingItem[];

    if (remainingShares <= 0) {
      updatedList = list.filter(h => h.id !== holdingId);
    } else {
      updatedList = list.map(h => h.id === holdingId ? { ...h, shares: remainingShares } : h);
    }

    set({ holdingsData: { ...get().holdingsData, [accountId]: updatedList } });
    StorageRepository.saveHoldings(accountId, updatedList);
  },

  restoreHistoryItem: (accountId, historyId) => {
    const historyItem = get().historyData.find(h => h.id === historyId);
    if (!historyItem) return;

    const updatedHistory = get().historyData.filter(h => h.id !== historyId);
    set({ historyData: updatedHistory });
    StorageRepository.saveHistory(updatedHistory);

    get().addHolding(accountId, {
      symbol: historyItem.symbol,
      name: historyItem.name,
      buyPrice: historyItem.buyPrice,
      currentPrice: historyItem.sellPrice,
      shares: historyItem.shares,
      tradeType: historyItem.tradeType,
      assetType: historyItem.assetType,
      date: historyItem.buyDate,
    });
  },

  splitHoldingLots: (accountId, holdingId) => {
    const list = get().holdingsData[accountId] || [];
    const holding = list.find(h => h.id === holdingId);
    if (!holding || !holding.lots || holding.lots.length <= 1) return;

    const newHoldings: HoldingItem[] = holding.lots.map((lot, idx) => ({
      id: `holding-${Date.now()}-${idx}`,
      symbol: holding.symbol,
      name: holding.name,
      buyPrice: lot.buyPrice,
      currentPrice: holding.currentPrice,
      shares: lot.shares,
      tradeType: lot.tradeType || holding.tradeType,
      assetType: holding.assetType,
      date: lot.date,
      lots: [lot],
    }));

    const updatedList = list.filter(h => h.id !== holdingId).concat(newHoldings);
    set({ holdingsData: { ...get().holdingsData, [accountId]: updatedList } });
    StorageRepository.saveHoldings(accountId, updatedList);
  },

  editHoldingLot: (accountId, holdingId, lotId, newBuyPrice, newShares, newDate) => {
    const list = get().holdingsData[accountId] || [];
    const holding = list.find(h => h.id === holdingId);
    if (!holding || !holding.lots) return;

    const updatedLots = holding.lots.map(l => l.id === lotId ? { ...l, buyPrice: newBuyPrice, shares: newShares, date: newDate } : l);
    const totalShares = updatedLots.reduce((sum, l) => sum + l.shares, 0);
    const totalCost = updatedLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
    const avgPrice = totalShares > 0 ? parseFloat((totalCost / totalShares).toFixed(2)) : holding.buyPrice;

    const updatedHolding: HoldingItem = {
      ...holding,
      lots: updatedLots,
      shares: totalShares,
      buyPrice: avgPrice,
    };

    const updatedList = list.map(h => h.id === holdingId ? updatedHolding : h);
    set({ holdingsData: { ...get().holdingsData, [accountId]: updatedList } });
    StorageRepository.saveHoldings(accountId, updatedList);
  },
});
