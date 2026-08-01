import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { History, ArrowUpRight, ArrowDownRight, RotateCcw, Award } from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const historyData = useStockStore(state => state.historyData);
  const restoreHistoryItem = useStockStore(state => state.restoreHistoryItem);
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const showToast = useStockStore(state => state.showToast);

  const totalTrades = historyData.length;
  const winningTrades = historyData.filter(h => h.realizedPnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalRealizedPnl = historyData.reduce((sum, h) => sum + h.realizedPnl, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Overview stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">歷史累積已實現總損益</span>
          <span className={`text-xl font-extrabold font-mono ${totalRealizedPnl >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">交易勝率</span>
            <span className="text-xl font-extrabold font-mono text-amber-300">
              {winRate.toFixed(1)}%
            </span>
          </div>
          <Award className="w-8 h-8 text-amber-400/80" />
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">平倉交易總筆數</span>
          <span className="text-xl font-extrabold font-mono text-indigo-300">
            {totalTrades} 筆 ({winningTrades} 勝 / {totalTrades - winningTrades} 敗)
          </span>
        </div>
      </div>

      {/* History table */}
      {historyData.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">目前尚無已實現交易歷史紀錄</p>
          <p className="text-xs text-slate-500 mt-1">於持股頁面點擊「平倉賣出」後，紀錄將自動移至此處。</p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-400" />
              已實現獲利 / 虧損歷史履歷
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {historyData.map(h => (
              <div key={h.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl text-white ${
                    h.realizedPnl >= 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {h.realizedPnl >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{h.name}</span>
                      <span className="font-mono text-xs text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                        {h.symbol}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                        {h.tradeType || '多-現股交易'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      買進: ${h.buyPrice} ({h.buyDate}) ➜ 賣出: ${h.sellPrice} ({h.sellDate}) | 股數: {h.shares.toLocaleString()} 股
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`text-base font-extrabold font-mono ${
                      h.realizedPnl >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {h.realizedPnl >= 0 ? '+' : ''}${h.realizedPnl.toLocaleString()}
                    </span>
                    <span className={`text-xs block font-mono font-bold ${
                      h.returnPct >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      ({h.returnPct >= 0 ? '+' : ''}{h.returnPct.toFixed(2)}%)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      restoreHistoryItem(currentAccountId, h.id);
                      showToast(`已成功將 ${h.name} 退回至庫存中！`);
                    }}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-indigo-950/60 hover:text-indigo-300 text-slate-400 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                    title="退回此筆紀錄至庫存"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>退回庫存</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
