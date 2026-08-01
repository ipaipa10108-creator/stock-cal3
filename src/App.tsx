import { useEffect } from 'react';
import { useStockStore } from './store/useStockStore';
import { Header } from './components/Header';
import { CalculatorTab } from './components/CalculatorTab';
import { HoldingsTab } from './components/HoldingsTab';
import { HistoryTab } from './components/HistoryTab';
import { MarketTab } from './components/MarketTab';
import { SettingsTab } from './components/SettingsTab';
import { AccountModal } from './components/modals/AccountModal';
import { ShareModal } from './components/modals/ShareModal';
import { CheckCircle } from 'lucide-react';

export function App() {
  const loadInitialData = useStockStore(state => state.loadInitialData);
  const activeTab = useStockStore(state => state.activeTab);
  const toastMessage = useStockStore(state => state.toastMessage);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 pt-6">
        {activeTab === 'calculator' && <CalculatorTab />}
        {activeTab === 'holdings' && <HoldingsTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'market' && <MarketTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <AccountModal />
      <ShareModal />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/80 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 backdrop-blur-md">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
