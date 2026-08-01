import { create } from 'zustand';
import { createAccountSlice, type AccountSlice } from './slices/accountSlice';
import { createHoldingsSlice, type HoldingsSlice } from './slices/holdingsSlice';
import { createQuoteSlice, type QuoteSlice } from './slices/quoteSlice';
import { createCalculatorSlice, type CalculatorSlice } from './slices/calculatorSlice';
import { createUiSlice, type UiSlice } from './slices/uiSlice';

export type BoundStore = AccountSlice & HoldingsSlice & QuoteSlice & CalculatorSlice & UiSlice;

export const useStockStore = create<BoundStore>()((...a) => ({
  ...createAccountSlice(...a),
  ...createHoldingsSlice(...a),
  ...createQuoteSlice(...a),
  ...createCalculatorSlice(...a),
  ...createUiSlice(...a),
}));
