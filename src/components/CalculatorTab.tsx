import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { StockSearchInput } from './StockSearchInput';
import { 
  calcTradeDetails, 
  calcBreakEvenPrice, 
  calcTicksBetween, 
  calcMarginMaintenanceRatio 
} from '../utils/stockMath';
import type { TradeTypeOption, AssetType } from '../types/stock';
import { Calculator, PlusCircle, ArrowUpRight, ArrowDownRight, ShieldAlert, Sparkles } from 'lucide-react';

export const CalculatorTab: React.FC = () => {
  const calculator = useStockStore(state => state.calculator);
  const setCalculatorField = useStockStore(state => state.setCalculatorField);
  const setCalculatorStockInfo = useStockStore(state => state.setCalculatorStockInfo);
  const globalDiscount = useStockStore(state => state.globalDiscount);
  const currentAccountId = useStockStore(state => state.currentAccountId);
  const addHolding = useStockStore(state => state.addHolding);
  const showToast = useStockStore(state => state.showToast);

  const {
    symbol,
    name,
    buyPrice,
    sellPrice,
    shares,
    discount,
    minFee,
    tradeType,
    assetType,
  } = calculator;

  const effDiscount = discount || globalDiscount;

  const buyDetails = calcTradeDetails(buyPrice, shares, effDiscount, minFee, true, assetType, tradeType, globalDiscount);
  const sellDetails = calcTradeDetails(sellPrice, shares, effDiscount, minFee, false, assetType, tradeType, globalDiscount);

  const totalBuyCost = (buyPrice * shares) + buyDetails.fee;
  const totalSellProceeds = (sellPrice * shares) - sellDetails.fee - sellDetails.tax;

  const pnl = totalSellProceeds - totalBuyCost;
  const pnlPct = totalBuyCost > 0 ? (pnl / totalBuyCost) * 100 : 0;

  const breakEven = calcBreakEvenPrice(buyPrice, effDiscount, minFee, shares, assetType, tradeType, globalDiscount, symbol);
  const ticksToBreakEven = calcTicksBetween(buyPrice, breakEven, assetType, symbol);

  const marginRatioResult = calcMarginMaintenanceRatio(buyPrice, sellPrice, shares, tradeType);

  const tradeTypeOptions: TradeTypeOption[] = [
    '多-現股交易',
    '多-現股當沖',
    '空-現股當沖',
    '多-資買券賣',
    '空-券賣資買',
    '多-資買資賣',
    '空-券賣券買',
  ];

  const handleAddHolding = () => {
    addHolding(currentAccountId, {
      symbol,
      name,
      buyPrice,
      currentPrice: sellPrice,
      shares,
      discount: effDiscount,
      minFee,
      tradeType,
      assetType,
      date: new Date().toISOString().split('T')[0],
    });
    showToast(`已成功將 ${name} (${symbol}) 加入庫存管理！`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
      <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 m-0">
            <Calculator className="w-5 h-5 text-indigo-400" />
            成交與當沖試算輸入表單
          </h2>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
            自動帶入名稱 & 價位
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            🔍 股票 / ETF 搜尋 (自動帶入名稱與現價)
          </label>
          <StockSearchInput
            value={symbol}
            onSelectStock={(info) => {
              setCalculatorStockInfo(info);
              showToast(`已自動帶入：${info.name} (${info.symbol}) - 價格: $${info.price}`);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">股票/ETF名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setCalculatorField('name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">資產類別</label>
            <select
              value={assetType}
              onChange={(e) => setCalculatorField('assetType', e.target.value as AssetType)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="股票">普通股票 (0.3% 證交稅)</option>
              <option value="ETF">ETF Beneficiary (0.1% 優惠稅)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">交易類型</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {tradeTypeOptions.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setCalculatorField('tradeType', t)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  tradeType === t
                    ? t.includes('當沖')
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">買入單價 (元)</label>
            <input
              type="number"
              step="0.01"
              value={buyPrice || ''}
              onChange={(e) => setCalculatorField('buyPrice', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">賣出預估單價 (元)</label>
            <input
              type="number"
              step="0.01"
              value={sellPrice || ''}
              onChange={(e) => setCalculatorField('sellPrice', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-slate-400">買賣股數</label>
            <span className="text-xs text-indigo-400 font-mono font-semibold">
              ＝ {(shares / 1000).toFixed(2)} 張
            </span>
          </div>
          <input
            type="number"
            value={shares || ''}
            onChange={(e) => setCalculatorField('shares', parseInt(e.target.value, 10) || 0)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-1.5 mt-2">
            {[1000, 2000, 3000, 5000, 10000].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setCalculatorField('shares', s)}
                className="flex-1 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono"
              >
                {s / 1000}張
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">券商手續費折數</label>
            <select
              value={effDiscount}
              onChange={(e) => setCalculatorField('discount', parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value={0.38}>38 折 (預設優惠)</option>
              <option value={0.28}>28 折 (大戶特惠)</option>
              <option value={0.60}>6 折 (一般券商)</option>
              <option value={1.00}>無折扣 (原價)</option>
              <option value={0}>0 折 (免手續費)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">最低手續費 (元)</label>
            <input
              type="number"
              value={minFee}
              onChange={(e) => setCalculatorField('minFee', parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddHolding}
          className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>將此筆試算部位加入庫存管理</span>
        </button>
      </div>

      <div className="lg:col-span-6 space-y-4">
        <div className={`border rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all ${
          pnl >= 0 
            ? 'bg-slate-900/90 border-rose-500/40' 
            : 'bg-slate-900/90 border-emerald-500/40'
        }`}>
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              試算總預估損益結果
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pnl >= 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {pnl >= 0 ? '獲利試算' : '虧損試算'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">預估淨損益 (新台幣)</span>
              <div className={`text-3xl sm:text-4xl font-extrabold font-mono flex items-center gap-1 ${
                pnl >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {pnl >= 0 ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                <span>{pnl >= 0 ? '+' : ''}${Math.round(pnl).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">預估報酬率</span>
              <span className={`text-xl sm:text-2xl font-bold font-mono ${pnlPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">買進總成本 (含買手續費)</span>
              <span className="text-base font-bold font-mono text-slate-200">
                ${Math.round(totalBuyCost).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">手續費: ${buyDetails.fee}</span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">賣出淨得款 (扣手續費與稅)</span>
              <span className="text-base font-bold font-mono text-slate-200">
                ${Math.round(totalSellProceeds).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">手續費: ${sellDetails.fee} | 證交稅: ${sellDetails.tax}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">保本參考價格 (Break-Even)</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-amber-300">${breakEven.toFixed(2)}</span>
              <span className="text-xs text-slate-400">
                (賣出不虧錢的最小合法檔位)
              </span>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl text-right">
            <span className="text-[10px] text-amber-400 font-semibold block">距離保本檔位</span>
            <span className="text-sm font-bold text-amber-300 font-mono">
              {ticksToBreakEven > 0 ? `需上漲 ${ticksToBreakEven} 檔` : `目前已超越保本 ${Math.abs(ticksToBreakEven)} 檔`}
            </span>
          </div>
        </div>

        {marginRatioResult && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                信用交易動態維持率與斷頭預警
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${marginRatioResult.badgeClass}`}>
                {marginRatioResult.statusLabel} ({marginRatioResult.formattedRatio})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 block">
                  {marginRatioResult.isMarginLong ? '融資借款金額' : '融券擔保品總額'}
                </span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  ${marginRatioResult.loanOrCollateralAmount.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">130% 斷頭追繳臨界價</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  ${marginRatioResult.liquidationPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
