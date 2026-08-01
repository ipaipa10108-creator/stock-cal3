import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { searchStockDictionary, findStockInDictionary } from '../db/stockDictionary';
import { fetchSingleStockQuote } from '../services/quoteService';
import type { AssetType, StockQuote } from '../types/stock';

interface StockSearchInputProps {
  value: string;
  onSelectStock: (stock: { symbol: string; name: string; price: number; assetType: AssetType }) => void;
  placeholder?: string;
  className?: string;
}

export const StockSearchInput: React.FC<StockSearchInputProps> = ({
  value,
  onSelectStock,
  placeholder = '輸入代號或名稱 (如 2330, 0050, 台積電)...',
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; type: AssetType; price?: number }>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.trim()) {
      const results = searchStockDictionary(query);
      setSuggestions(results);
    } else {
      setSuggestions(searchStockDictionary('2330'));
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (symbol: string, defaultName: string, defaultPrice: number = 0, type?: AssetType) => {
    setQuery(symbol);
    setIsOpen(false);
    setLoading(true);

    const assetType = type || (symbol.startsWith('00') ? 'ETF' : '股票');

    try {
      const quote: StockQuote = await fetchSingleStockQuote(symbol);
      
      onSelectStock({
        symbol: quote.code || symbol,
        name: quote.name || defaultName || symbol,
        price: quote.price > 0 ? quote.price : (defaultPrice || 100),
        assetType,
      });
    } catch (e) {
      onSelectStock({
        symbol,
        name: defaultName || symbol,
        price: defaultPrice || 100,
        assetType,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = query.trim().toUpperCase();
      if (q) {
        const dict = findStockInDictionary(q);
        handleSelect(q, dict?.name || q, dict?.price || 0, dict?.type);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500 font-medium transition-all shadow-inner"
        />
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Search className="w-4 h-4 text-slate-400" />}
        </div>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
            }}
            className="absolute right-3 text-xs bg-slate-800 text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded-full"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-72 overflow-y-auto divide-y divide-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 bg-slate-950/60 text-[11px] font-semibold text-slate-400 flex justify-between items-center tracking-wider uppercase">
            <span>🔍 搜尋台股 / ETF 字典 (點擊自動帶入價位)</span>
            {loading && <span className="text-indigo-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 連動即時盤中價...</span>}
          </div>

          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => handleSelect(item.symbol, item.name, item.price, item.type)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-indigo-600/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-indigo-300 group-hover:text-indigo-200 text-sm bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                    {item.symbol}
                  </span>
                  <span className="font-medium text-slate-200 group-hover:text-white text-sm">
                    {item.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    item.type === 'ETF'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.type}
                  </span>
                </div>
                {item.price && (
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-400 text-xs font-mono font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>${item.price}</span>
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 text-center flex flex-col items-center gap-1">
              <span>找不到與 &quot;{query}&quot; 相符的台股</span>
              <button
                type="button"
                onClick={() => handleSelect(query.toUpperCase(), query.toUpperCase(), 100, query.startsWith('00') ? 'ETF' : '股票')}
                className="mt-1 text-xs text-indigo-400 hover:underline font-semibold"
              >
                直接以代號 &quot;{query.toUpperCase()}&quot; 帶入試算 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
