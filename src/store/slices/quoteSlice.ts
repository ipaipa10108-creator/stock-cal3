import type { StateCreator } from 'zustand';
import type { StockQuote, ApiProvider } from '../../types/stock';
import { fetchQuotesByProvider, fetchSingleStockQuote } from '../../services/quoteService';

export interface QuoteSlice {
  quotes: Record<string, StockQuote>;
  isQuoteLoading: boolean;
  lastQuoteUpdate: string | null;
  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;
  fetchQuotes: (symbols: string[]) => Promise<void>;
  fetchAndSetSingleQuote: (symbol: string) => Promise<StockQuote>;
}

export const createQuoteSlice: StateCreator<QuoteSlice, [], [], QuoteSlice> = (set, get) => ({
  quotes: {},
  isQuoteLoading: false,
  lastQuoteUpdate: null,
  apiProvider: 'auto',

  setApiProvider: (provider) => set({ apiProvider: provider }),

  fetchQuotes: async (symbols) => {
    if (symbols.length === 0) return;
    set({ isQuoteLoading: true });
    try {
      const fetched = await fetchQuotesByProvider(symbols, get().apiProvider);
      const existing = get().quotes;

      const updatedQuotes: Record<string, StockQuote> = { ...existing };
      Object.keys(fetched).forEach(code => {
        const newQ = fetched[code];
        const oldQ = existing[code];
        if (oldQ && oldQ.price > 0 && newQ.price !== oldQ.price) {
          (newQ as any).flashClass = newQ.price > oldQ.price ? 'flash-up' : 'flash-down';
        }
        updatedQuotes[code] = newQ;
      });

      set({
        quotes: updatedQuotes,
        isQuoteLoading: false,
        lastQuoteUpdate: new Date().toLocaleTimeString(),
      });
    } catch (e) {
      set({ isQuoteLoading: false });
    }
  },

  fetchAndSetSingleQuote: async (symbol) => {
    const quote = await fetchSingleStockQuote(symbol);
    set(state => ({
      quotes: { ...state.quotes, [quote.code]: quote }
    }));
    return quote;
  },
});
