import type { StateCreator } from 'zustand';
import type { AssetType, TradeTypeOption } from '../../types/stock';

export interface CalculatorState {
  symbol: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  shares: number;
  discount: number;
  minFee: number;
  tradeType: TradeTypeOption;
  assetType: AssetType;
  isCustomDiscount: boolean;
}

export interface CalculatorSlice {
  calculator: CalculatorState;
  setCalculatorField: <K extends keyof CalculatorState>(field: K, value: CalculatorState[K]) => void;
  setCalculatorStockInfo: (info: { symbol: string; name: string; price: number; assetType?: AssetType }) => void;
  resetCalculator: () => void;
}

const initialCalculatorState: CalculatorState = {
  symbol: '2330',
  name: '台積電',
  buyPrice: 960,
  sellPrice: 965,
  shares: 1000,
  discount: 0.38,
  minFee: 20,
  tradeType: '多-現股交易',
  assetType: '股票',
  isCustomDiscount: false,
};

export const createCalculatorSlice: StateCreator<CalculatorSlice, [], [], CalculatorSlice> = (set) => ({
  calculator: initialCalculatorState,

  setCalculatorField: (field, value) => {
    set(state => ({
      calculator: {
        ...state.calculator,
        [field]: value,
      }
    }));
  },

  setCalculatorStockInfo: ({ symbol, name, price, assetType }) => {
    set(state => ({
      calculator: {
        ...state.calculator,
        symbol,
        name,
        buyPrice: price > 0 ? price : state.calculator.buyPrice,
        sellPrice: price > 0 ? price : state.calculator.sellPrice,
        assetType: assetType || (symbol.startsWith('00') ? 'ETF' : '股票'),
      }
    }));
  },

  resetCalculator: () => set({ calculator: initialCalculatorState }),
});
