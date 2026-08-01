import React, { useState } from 'react';
import { useStockStore } from '../store/useStockStore';
import type { HoldingItem, HoldingLot } from '../types/stock';
import { 
  calcTradeDetails, 
  calcBreakEvenPrice, 
  calcTicksBetween, 
  calcMarginMaintenanceRatio 
} from '../utils/stockMath';
import { 
  PlusCircle, 
  RefreshCw, 
  Share2, 
  Layers, 
  Edit3, 
  Trash2, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert 
} from 'lucide-react';
import { AddHoldingModal } from './modals/AddHoldingModal';
import { EditLotModal } from './modals/EditLotModal';
import { SellModal } from './modals/SellModal';

export const HoldingsTab: React.FC = () => {
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const holdingsData = useStockStore(state => state.holdingsData);
  const quotes = useStockStore(state => state.quotes);
  const globalDiscount = useStockStore(state => state.globalDiscount);
  const fetchQuotes = useStockStore(state => state.fetchQuotes);
  const isQuoteLoading = useStockStore(state => state.isQuoteLoading);
  const lastQuoteUpdate = useStockStore(state => state.lastQuoteUpdate);
  const deleteHolding = useStockStore(state => state.deleteHolding);
  const splitHoldingLots = useStockStore(state => state.splitHoldingLots);
  const setIsShareModalOpen = useStockStore(state => state.setIsShareModalOpen);
  const showToast = useStockStore(state => state.showToast);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<{ holding: HoldingItem; lot: HoldingLot } | null>(null);
  const [sellingHolding, setSellingHolding] = useState<HoldingItem | null>(null);
  const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({});

  const currentHoldings = holdingsData[currentAccountId] || [];

  const handleRefreshQuotes = async () => {
    const symbols = currentHoldings.map(h => h.symbol);
    if (symbols.length === 0) return;
    await fetchQuotes(symbols);
    showToast('盤中即時行情已成功更新！');
  };

  const toggleExpandLots = (id: string) => {
    setExpandedLots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-200">
            📦 帳戶持股部位 ({currentHoldings.length} 檔)
          </span>
          {lastQuoteUpdate && (
            <span className="text-xs text-slate-400 font-mono">
              (最後更新: {lastQuoteUpdate})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshQuotes}
            disabled={isQuoteLoading || currentHoldings.length === 0}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isQuoteLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isQuoteLoading ? '更新中...' : '刷新行情'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>分享/匯入</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新增持股</span>
          </button>
        </div>
      </div>

      {currentHoldings.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">此帳戶目前尚無持股部位</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            您可在「成交試算」分頁點擊加入庫存，或在此點擊下方按鈕手動新增部位。
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            新增第一筆持股
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentHoldings.map(h => {
            const liveQuote = quotes[h.symbol];
            const currentPrice = liveQuote?.price || h.currentPrice || h.buyPrice;
            const effDiscount = h.discount || globalDiscount;

            const buyFee = calcTradeDetails(h.buyPrice, h.shares, effDiscount, h.minFee, true, h.assetType, h.tradeType, globalDiscount).fee;
            const buyCost = (h.buyPrice * h.shares) + buyFee;
            
            const sellDetails = calcTradeDetails(currentPrice, h.shares, effDiscount, h.minFee, false, h.assetType, h.tradeType, globalDiscount);
            const proceeds = (currentPrice * h.shares) - sellDetails.fee - sellDetails.tax;
            
            const pnl = proceeds - buyCost;
            const pnlPct = buyCost > 0 ? (pnl / buyCost) * 100 : 0;

            const breakEven = calcBreakEvenPrice(h.buyPrice, effDiscount, h.minFee, h.shares, h.assetType, h.tradeType, globalDiscount, h.symbol);
            const ticksToBreakEven = calcTicksBetween(currentPrice, breakEven, h.assetType, h.symbol);

            const marginResult = calcMarginMaintenanceRatio(h.buyPrice, currentPrice, h.shares, h.tradeType);
            const hasMultipleLots = h.lots && h.lots.length > 1;
            const isLotsExpanded = expandedLots[h.id];

            return (
              <div
                key={h.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 transition-all ${
                  pnl >= 0 ? 'border-slate-800 hover:border-rose-500/30' : 'border-slate-800 hover:border-emerald-500/30'
                } ${h.flashClass || ''}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-100">{h.name}</span>
                        <span className="font-mono text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                          {h.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          h.tradeType?.includes('當沖')
                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                            : 'bg-indigo-600 text-white font-semibold'
                        }`}>
                          {h.tradeType || '多-現股交易'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {h.shares.toLocaleString()} 股 ({(h.shares / 1000).toFixed(2)}張)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">當前市價</span>
                      <span className="text-lg font-extrabold font-mono text-slate-100">
                        ${currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">未實現損益</span>
                      <span className={`text-base font-extrabold font-mono ${pnl >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {pnl >= 0 ? '+' : ''}${Math.round(pnl).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">報酬率</span>
                      <span className={`text-base font-extrabold font-mono ${pnlPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="bg-slate-950/40 p-2 rounded-lg">
                      <span className="text-slate-400 block">買入均價</span>
                      <span className="font-mono font-bold text-slate-200">${h.buyPrice.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded-lg">
                      <span className="text-slate-400 block">保本參考價</span>
                      <span className="font-mono font-bold text-amber-300">${breakEven.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] font-medium text-slate-400 flex items-center justify-between bg-slate-950/30 px-2.5 py-1 rounded-lg">
                    <span>檔位動態:</span>
                    <span className={`font-mono font-bold ${ticksToBreakEven > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {ticksToBreakEven > 0 ? `離保本差 ${ticksToBreakEven} 檔` : `已獲利 ${Math.abs(ticksToBreakEven)} 檔`}
                    </span>
                  </div>

                  {marginResult && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        維持率
                      </span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded ${marginResult.badgeClass}`}>
                        {marginResult.formattedRatio} ({marginResult.statusLabel})
                      </span>
                    </div>
                  )}

                  {hasMultipleLots && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => toggleExpandLots(h.id)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1"
                      >
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          分批買進明細 ({h.lots?.length} 筆)
                        </span>
                        {isLotsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isLotsExpanded && (
                        <div className="space-y-1.5 mt-1.5 max-h-40 overflow-y-auto">
                          {h.lots?.map((lot, idx) => (
                            <div key={lot.id} className="bg-slate-950 p-2 rounded-lg text-[11px] flex items-center justify-between font-mono">
                              <div>
                                <span className="text-slate-400">#{idx + 1} {lot.date}</span>
                                <span className="text-slate-200 block font-bold">${lot.buyPrice} ({lot.shares}股)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingHolding({ holding: h, lot })}
                                className="text-indigo-400 hover:underline text-[10px] flex items-center gap-0.5"
                              >
                                <Edit3 className="w-3 h-3" /> 編輯
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSellingHolding(h)}
                    className="flex-1 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>平倉賣出</span>
                  </button>

                  {hasMultipleLots && (
                    <button
                      type="button"
                      onClick={() => {
                        splitHoldingLots(currentAccountId, h.id);
                        showToast(`已將 ${h.name} 拆解為 ${h.lots?.length} 筆獨立部位！`);
                      }}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
                      title="將分批明細拆分為獨立持股卡片"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`確定要刪除 ${h.name} (${h.symbol}) 部位紀錄嗎？`)) {
                        deleteHolding(currentAccountId, h.id);
                        showToast(`已刪除 ${h.name} 持股！`);
                      }
                    }}
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddHoldingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {editingHolding && (
        <EditLotModal
          holding={editingHolding.holding}
          lot={editingHolding.lot}
          onClose={() => setEditingHolding(null)}
        />
      )}

      {sellingHolding && (
        <SellModal
          holding={sellingHolding}
          onClose={() => setSellingHolding(null)}
        />
      )}
    </div>
  );
};
