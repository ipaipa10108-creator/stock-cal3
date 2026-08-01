import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import type { HoldingItem, HoldingLot } from '../../types/stock';
import { Edit3, X } from 'lucide-react';

interface EditLotModalProps {
  holding: HoldingItem;
  lot: HoldingLot;
  onClose: () => void;
}

export const EditLotModal: React.FC<EditLotModalProps> = ({ holding, lot, onClose }) => {
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const editHoldingLot = useStockStore(state => state.editHoldingLot);
  const showToast = useStockStore(state => state.showToast);

  const [buyPrice, setBuyPrice] = useState(lot.buyPrice);
  const [shares, setShares] = useState(lot.shares);
  const [date, setDate] = useState(lot.date || new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyPrice <= 0 || shares <= 0) return;

    editHoldingLot(currentAccountId, holding.id, lot.id, buyPrice, shares, date);
    showToast(`已成功修改 ${holding.name} 明細與重算成本！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            修改分批買進細項明細
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            標的: <span className="font-bold text-white">{holding.name} ({holding.symbol})</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">買入單價 (元)</label>
            <input
              type="number"
              step="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">買入股數</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">買入日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg cursor-pointer mt-2"
          >
            儲存並重新計算
          </button>
        </form>
      </div>
    </div>
  );
};
