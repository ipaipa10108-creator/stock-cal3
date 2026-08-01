import React, { useEffect } from 'react';
import { useStockStore } from '../store/useStockStore';
import { STOCK_DICTIONARY } from '../db/stockDictionary';
import { TrendingUp, RefreshCw, Zap } from 'lucide-react';
import { StockSearchInput } from './StockSearchInput';

export const MarketTab: React.FC = () => {
  const quotes = useStockStore(state => state.quotes);
  const fetchQuotes = useStockStore(state => state.fetchQuotes);
  const isQuoteLoading = useStockStore(state => state.isQuoteLoading);
  const setCalculatorStockInfo = useStockStore(state => state.setCalculatorStockInfo);
  const setActiveTab = useStockStore(state => state.setActiveTab);
  const showToast = useStockStore(state => state.showToast);

  const hotSymbols = STOCK_DICTIONARY.map(s => s.symbol);

  useEffect(() => {
    fetchQuotes(hotSymbols.slice(0, 12));
  }, []);

  const handleRefresh = () => {
    fetchQuotes(hotSymbols.slice(0, 12));
    showToast('已更新熱門觀察清單行情！');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            台股與熱門 ETF 即時行情觀察清單
          </h2>
          <p className="text-xs text-slate-400">點擊任意標的即可帶入「成交試算」進行精確盈虧計算</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isQuoteLoading}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isQuoteLoading ? 'animate-spin' : ''}`} />
          <span>{isQuoteLoading ? '更新中...' : '即時刷新'}</span>
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          🔍 搜尋個股或 ETF (選擇後自動帶入並帶入試算)
        </label>
        <StockSearchInput
          value=""
          onSelectStock={(info) => {
            setCalculatorStockInfo(info);
            setActiveTab('calculator');
            showToast(`已帶入 ${info.name} ($${info.price}) 至試算頁面！`);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {STOCK_DICTIONARY.map(item => {
          const liveQ = quotes[item.symbol];
          const price = liveQ?.price || item.price || 100;
          const change = liveQ?.change || 0;
          const changePct = liveQ?.changePct || 0;

          return (
            <div
              key={item.symbol}
              onClick={() => {
                setCalculatorStockInfo({
                  symbol: item.symbol,
                  name: item.name,
                  price,
                  assetType: item.type,
                });
                setActiveTab('calculator');
                showToast(`已帶入 ${item.name} (${item.symbol}) 至試算！`);
              }}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 p-3.5 rounded-2xl shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {item.name}
                    </span>
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      {item.symbol}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                    item.type === 'ETF'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.type}
                  </span>
                </div>

                <div className="text-right font-mono">
                  <span className="text-base font-extrabold text-slate-100 block">
                    ${price.toFixed(2)}
                  </span>
                  <span className={`text-xs font-bold ${change >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                  <Zap className="w-3 h-3 text-amber-400" />
                  點擊立體試算
                </span>
                <span className="font-mono text-[10px]">市場: {item.market}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
