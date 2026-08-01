import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { Wallet, Edit2, Plus, Check, X, Trash2 } from 'lucide-react';

export const AccountModal: React.FC = () => {
  const isAccountModalOpen = useStockStore(state => state.isAccountModalOpen);
  const setIsAccountModalOpen = useStockStore(state => state.setIsAccountModalOpen);
  const accounts = useStockStore(state => state.accounts);
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const setCurrentAccountId = useStockStore(state => state.setCurrentAccountId);
  const addAccount = useStockStore(state => state.addAccount);
  const updateAccountName = useStockStore(state => state.updateAccountName);
  const deleteAccount = useStockStore(state => state.deleteAccount);
  const showToast = useStockStore(state => state.showToast);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newAccName, setNewAccName] = useState('');

  if (!isAccountModalOpen) return null;

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      updateAccountName(id, editingName.trim());
      showToast('已成功更新帳號名稱！');
    }
    setEditingId(null);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    addAccount(newAccName.trim());
    setNewAccName('');
    showToast('已新增證券帳號！');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <Wallet className="w-5 h-5 text-indigo-400" />
            證券帳號管理與切換
          </h3>
          <button type="button" onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of accounts */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {accounts.map(acc => {
            const isSelected = acc.id === currentAccountId;
            const isEditing = acc.id === editingId;

            return (
              <div
                key={acc.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/80'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-sm text-slate-100 font-semibold"
                    />
                    <button type="button" onClick={() => handleSaveEdit(acc.id)} className="text-emerald-400">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentAccountId(acc.id);
                      showToast(`已切換至帳號: ${acc.name}`);
                    }}
                    className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                    <span className={`text-sm font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                      {acc.name}
                    </span>
                    {isSelected && <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-mono">使用中</span>}
                  </button>
                )}

                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(acc.id, acc.name)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`確定要刪除帳號「${acc.name}」嗎？`)) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new account form */}
        <form onSubmit={handleAddAccount} className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={newAccName}
            onChange={(e) => setNewAccName(e.target.value)}
            placeholder="新增帳號名稱 (如 國泰證券)..."
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增</span>
          </button>
        </form>
      </div>
    </div>
  );
};
