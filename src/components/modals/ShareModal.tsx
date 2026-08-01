import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { Share2, Copy, FileText, X } from 'lucide-react';
import { formatAllHoldingsToShareText, parseShareText } from '../../utils/shareUtils';

export const ShareModal: React.FC = () => {
  const isShareModalOpen = useStockStore(state => state.isShareModalOpen);
  const setIsShareModalOpen = useStockStore(state => state.setIsShareModalOpen);
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const accounts = useStockStore(state => state.accounts);
  const holdingsData = useStockStore(state => state.holdingsData);
  const addHolding = useStockStore(state => state.addHolding);
  const showToast = useStockStore(state => state.showToast);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');

  if (!isShareModalOpen) return null;

  const currentAccount = accounts.find(a => a.id === currentAccountId);
  const currentHoldings = holdingsData[currentAccountId] || [];
  const exportText = formatAllHoldingsToShareText(currentHoldings, currentAccount?.name);

  const handleCopyText = () => {
    navigator.clipboard.writeText(exportText);
    showToast('已複製庫存文字至剪貼簿！');
  };

  const handleParseAndImport = () => {
    const parsed = parseShareText(importText);
    if (parsed.length === 0) {
      alert('無法解析輸入之文字，請確認格式。');
      return;
    }

    parsed.forEach(item => {
      if (item.symbol && item.buyPrice && item.shares) {
        addHolding(currentAccountId, {
          symbol: item.symbol,
          name: item.name || item.symbol,
          buyPrice: item.buyPrice,
          currentPrice: item.buyPrice,
          shares: item.shares,
          tradeType: item.tradeType || '多-現股交易',
          date: item.date || new Date().toISOString().split('T')[0],
        });
      }
    });

    showToast(`成功智慧解析並匯入 ${parsed.length} 筆持股部位！`);
    setImportText('');
    setIsShareModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <Share2 className="w-5 h-5 text-indigo-400" />
            庫存文字分享與智慧解析匯入
          </h3>
          <button type="button" onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'export' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            📤 匯出分享文字
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            📥 智慧解析匯入
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-3">
            <textarea
              readOnly
              value={exportText}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>一鍵複製全庫存分享文字</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="請在此貼上 LINE / FB 或分享文字 (包含股票代號、買價、張數/股數)..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none placeholder-slate-500"
            />
            <button
              type="button"
              onClick={handleParseAndImport}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>執行智慧解析並匯入當前帳戶</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
