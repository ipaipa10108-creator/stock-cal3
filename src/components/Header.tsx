import React from 'react';
import { useStockStore } from '../store/useStockStore';
import type { ActiveTab } from '../store/slices/uiSlice';
import { Calculator, Briefcase, History, TrendingUp, Settings, Wallet, ArrowRightLeft } from 'lucide-react';
import { calcTradeDetails } from '../utils/stockMath';

export const Header: React.FC = () => {
  const activeTab = useStockStore(state => state.activeTab);
  const setActiveTab = useStockStore(state => state.setActiveTab);
  const accounts = useStockStore(state => state.accounts);
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const holdingsData = useStockStore(state => state.holdingsData);
  const quotes = useStockStore(state => state.quotes);
  const globalDiscount = useStockStore(state => state.globalDiscount);
  const setIsAccountModalOpen = useStockStore(state => state.setIsAccountModalOpen);

  const currentAccount = accounts.find(a => a.id === currentAccountId) || accounts[0];
  const currentHoldings = holdingsData[currentAccountId] || [];

  let totalCost = 0;
  let totalMarketValue = 0;

  currentHoldings.forEach(h => {
    const quotePrice = quotes[h.symbol]?.price || h.currentPrice || h.buyPrice;
    const buyFee = calcTradeDetails(h.buyPrice, h.shares, h.discount, h.minFee, true, h.assetType, h.tradeType, globalDiscount).fee;
    const cost = (h.buyPrice * h.shares) + buyFee;
    const mv = quotePrice * h.shares;

    totalCost += cost;
    totalMarketValue += mv;
  });

  const totalUnrealizedPnl = totalMarketValue - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalUnrealizedPnl / totalCost) * 100 : 0;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'calculator', label: '成交試算', icon: <Calculator className="w-4 h-4" /> },
    { id: 'holdings', label: '庫存部位', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'history', label: '歷史紀錄', icon: <History className="w-4 h-4" /> },
    { id: 'market', label: '熱門行情', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: '系統設定', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 m-0 leading-tight">
                Stock-Cal <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono">v2.0 SDD</span>
              </h1>
              <p className="text-xs text-slate-400">台股 / ETF 即時交易試算與部位管理系統</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold">{currentAccount?.name || '主要帳號'}</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">庫存總市值</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-100">
              ${Math.round(totalMarketValue).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">總投入成本</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-300">
              ${Math.round(totalCost).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">未實現損益</span>
            <span className={`text-base sm:text-lg font-bold font-mono ${totalUnrealizedPnl >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${Math.round(totalUnrealizedPnl).toLocaleString()}
              <span className="text-xs ml-1">({totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%)</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl shadow-inner flex flex-col justify-center">
            <span className="text-[11px] text-slate-400 block font-medium">持股檔數</span>
            <span className="text-base sm:text-lg font-bold font-mono text-indigo-300">
              {currentHoldings.length} 檔
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
