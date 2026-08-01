import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { Settings, Download, Upload, Database } from 'lucide-react';
import { StorageRepository } from '../db/stockRepository';

export const SettingsTab: React.FC = () => {
  const globalDiscount = useStockStore(state => state.globalDiscount);
  const setGlobalDiscount = useStockStore(state => state.setGlobalDiscount);
  const accounts = useStockStore(state => state.accounts);
  const holdingsData = useStockStore(state => state.holdingsData);
  const historyData = useStockStore(state => state.historyData);
  const showToast = useStockStore(state => state.showToast);

  const handleSaveDiscount = (val: number) => {
    setGlobalDiscount(val);
    showToast(`已儲存券商手續費折數為 ${(val * 100).toFixed(0)} 折！`);
  };

  const handleExportJson = () => {
    const data = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      globalDiscount,
      accounts,
      holdingsData,
      historyData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stock-Cal-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('備份 JSON 檔案已下載！');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.accounts) StorageRepository.saveAccounts(json.accounts);
        if (json.historyData) StorageRepository.saveHistory(json.historyData);
        if (json.globalDiscount) StorageRepository.saveDiscount(json.globalDiscount);
        
        if (json.holdingsData) {
          Object.keys(json.holdingsData).forEach(accId => {
            StorageRepository.saveHoldings(accId, json.holdingsData[accId]);
          });
        }

        window.location.reload();
      } catch (err) {
        alert('備份 JSON 檔案格式無效');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0 border-b border-slate-800 pb-3">
          <Settings className="w-5 h-5 text-indigo-400" />
          全域券商手續費與優惠折數設定
        </h2>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            選擇預設券商折數 (目前為: {(globalDiscount * 100).toFixed(0)} 折)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '28 折 (特惠)', val: 0.28 },
              { label: '38 折 (預設)', val: 0.38 },
              { label: '60 折 (標準)', val: 0.60 },
              { label: '0 折 (免手續費)', val: 0.00 },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => handleSaveDiscount(item.val)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  globalDiscount === item.val
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-indigo-400" />
          100% 本機數據隱私與 JSON 備份還原
        </h2>

        <p className="text-xs text-slate-400">
          本系統資料僅儲存於您個人的瀏覽器中 (IndexedDB / LocalStorage)，完全不會上傳至任何雲端伺服器。建議定期匯出 JSON 檔案備份。
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>匯出完整 JSON 備份檔</span>
          </button>

          <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>匯入 JSON 備份檔還原</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
