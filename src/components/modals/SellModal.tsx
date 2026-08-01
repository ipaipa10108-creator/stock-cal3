import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import type { HoldingItem } from '../../types/stock';
import { DollarSign, X } from 'lucide-react';
import { calcTradeDetails } from '../../utils/stockMath';

interface SellModalProps {
  holding: HoldingItem;
  onClose: () => void;
}

export const SellModal: React.FC<SellModalProps> = ({ holding, onClose }) => {
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const sellHolding = useStockStore(state => state.sellHolding);
  const globalDiscount = useStockStore(state => state.globalDiscount);
  const showToast = useStockStore(state => state.showToast);

  const [sellPrice, setSellPrice] = useState(holding.currentPrice || holding.buyPrice);
  const [sellShares, setSellShares] = useState(holding.shares);
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);

  const effDiscount = holding.discount || globalDiscount;
  const buyFee = calcTradeDetails(holding.buyPrice, sellShares, effDiscount, holding.minFee, true, holding.assetType, holding.tradeType, globalDiscount).fee;
  const buyCost = (holding.buyPrice * sellShares) + buyFee;

  const sellDetails = calcTradeDetails(sellPrice, sellShares, effDiscount, holding.minFee, false, holding.assetType, holding.tradeType, globalDiscount);
  const proceeds = (sellPrice * sellShares) - sellDetails.fee - sellDetails.tax;

  const estPnl = proceeds - buyCost;
  const estReturnPct = buyCost > 0 ? (estPnl / buyCost) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellPrice <= 0 || sellShares <= 0) return;

    sellHolding(currentAccountId, holding.id, sellPrice, sellShares, sellDate);
    showToast(`已成功賣出 ${holding.name} ${sellShares.toLocaleString()} 股並移至歷史紀錄！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <DollarSign className="w-5 h-5 text-rose-400" />
            平倉賣出庫存部位
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            標的: <span className="font-bold text-white">{holding.name} ({holding.symbol})</span> | 庫存總股數: <span className="font-mono font-bold">{holding.shares.toLocaleString()}</span> 股
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">賣出單價 (元)</label>
              <input
                type="number"
                step="0.01"
                value={sellPrice || ''}
                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">賣出股數</label>
              <input
                type="number"
                max={holding.shares}
                value={sellShares || ''}
                onChange={(e) => setSellShares(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">賣出日期</label>
            <input
              type="date"
              value={sellDate}
              onChange={(e) => setSellDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono text-slate-100"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[11px] text-slate-400 block">試算實現損益</span>
              <span className={`text-base font-extrabold font-mono ${estPnl >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {estPnl >= 0 ? '+' : ''}${Math.round(estPnl).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">報酬率</span>
              <span className={`text-sm font-bold font-mono ${estReturnPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {estReturnPct >= 0 ? '+' : ''}{estReturnPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg cursor-pointer mt-2"
          >
            確認平倉賣出並寫入歷史
          </button>
        </form>
      </div>
    </div>
  );
};
