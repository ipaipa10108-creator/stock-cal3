import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { StockSearchInput } from '../StockSearchInput';
import type { TradeTypeOption, AssetType } from '../../types/stock';
import { PlusCircle, X } from 'lucide-react';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({ isOpen, onClose }) => {
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const addHolding = useStockStore(state => state.addHolding);
  const showToast = useStockStore(state => state.showToast);

  const [symbol, setSymbol] = useState('2330');
  const [name, setName] = useState('台積電');
  const [buyPrice, setBuyPrice] = useState(960);
  const [currentPrice, setCurrentPrice] = useState(965);
  const [shares, setShares] = useState(1000);
  const [tradeType, setTradeType] = useState<TradeTypeOption>('多-現股交易');
  const [assetType, setAssetType] = useState<AssetType>('股票');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyPrice <= 0 || shares <= 0) return;

    addHolding(currentAccountId, {
      symbol,
      name,
      buyPrice,
      currentPrice,
      shares,
      tradeType,
      assetType,
      date: new Date().toISOString().split('T')[0],
    });

    showToast(`已成功將 ${name} (${symbol}) 新增至庫存！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            手動新增庫存部位
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              🔍 股票 / ETF 搜尋 (自動帶入名稱與現價)
            </label>
            <StockSearchInput
              value={symbol}
              onSelectStock={(info) => {
                setSymbol(info.symbol);
                setName(info.name);
                if (info.price > 0) {
                  setBuyPrice(info.price);
                  setCurrentPrice(info.price);
                }
                setAssetType(info.assetType || (info.symbol.startsWith('00') ? 'ETF' : '股票'));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">名稱</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">交易類型</label>
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value as TradeTypeOption)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none cursor-pointer"
              >
                <option value="多-現股交易">多-現股交易</option>
                <option value="多-現股當沖">多-現股當沖</option>
                <option value="空-現股當沖">空-現股當沖</option>
                <option value="多-資買券賣">多-資買券賣</option>
                <option value="空-券賣資買">空-券賣資買</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">買入單價 (元)</label>
              <input
                type="number"
                step="0.01"
                value={buyPrice || ''}
                onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">當前市價 (元)</label>
              <input
                type="number"
                step="0.01"
                value={currentPrice || ''}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">買入股數 (＝ {(shares / 1000).toFixed(2)} 張)</label>
            <input
              type="number"
              value={shares || ''}
              onChange={(e) => setShares(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer mt-2"
          >
            確認新增庫存
          </button>
        </form>
      </div>
    </div>
  );
};
