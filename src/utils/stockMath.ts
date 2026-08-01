import type { AssetType, TradeTypeOption, MaintenanceRatioResult } from '../types/stock';

/**
 * 清理並轉換數字輸入值，確保為有效且非 NaN 之數字
 */
export const cleanNum = (val: any, fallback: number = 0): number => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? fallback : num;
};

/**
 * 精確四捨五入指定小數位數
 */
export const roundTo = (val: number, decimals: number = 2): number => {
  if (isNaN(val) || !isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
};

/**
 * 3.1 交易費用與稅額計算
 */
export const calcTradeDetails = (
  price: number,
  shares: number,
  discount: number | undefined,
  minFee: number | undefined,
  isBuy: boolean,
  assetType?: AssetType,
  tradeType?: TradeTypeOption,
  globalDiscount: number = 0.38
): { fee: number; tax: number } => {
  const p = cleanNum(price);
  const s = cleanNum(shares);

  if (p <= 0 || s <= 0) {
    return { fee: 0, tax: 0 };
  }

  // 1. 計算有效折數
  const effDiscount = (discount !== undefined && discount !== null) ? discount : globalDiscount;
  
  // 2. 計算原始手續費
  const rawFee = p * s * 0.001425 * effDiscount;
  
  // 3. 套用最低手續費與無條件捨去
  const effectiveMinFee = (minFee !== undefined && minFee !== null) ? minFee : 20;
  const fee = Math.max(effectiveMinFee, Math.floor(rawFee));

  // 4. 計算證交稅 (Tax)
  let tax = 0;
  if (!isBuy) {
    let taxRate = 0.003; // 普通股預設 0.3%
    if (assetType === 'ETF') {
      taxRate = 0.001; // ETF 0.1%
    } else if (tradeType && tradeType.includes('當沖')) {
      taxRate = 0.0015; // 當沖 0.15%
    }
    tax = Math.floor(p * s * taxRate);
  }

  return { fee, tax };
};

/**
 * 3.2 取得台灣股市 Tick Size (檔位)
 */
export const getTickSize = (
  price: number,
  assetType?: AssetType | string,
  symbol?: string
): number => {
  const p = cleanNum(price);
  if (p <= 0) return 0.01;

  const isEtf = assetType === 'ETF' || (symbol && symbol.startsWith('00'));

  if (isEtf) {
    if (p < 50) return 0.01;
    return 0.05;
  } else {
    if (p < 10) return 0.01;
    if (p < 50) return 0.05;
    if (p < 100) return 0.10;
    if (p < 500) return 0.50;
    if (p < 1000) return 1.00;
    return 5.00;
  }
};

/**
 * 對齊價格至合法 Tick 檔位
 */
export const alignToTick = (
  price: number,
  assetType?: AssetType | string,
  symbol?: string
): number => {
  const p = cleanNum(price);
  if (p <= 0) return 0;
  const step = getTickSize(p, assetType, symbol);
  return roundTo(Math.round(p / step) * step, 2);
};

/**
 * 計算兩價格之間的 Tick (檔位) 跳動距離
 */
export const calcTicksBetween = (
  fromPrice: number,
  toPrice: number,
  assetType?: AssetType | string,
  symbol?: string
): number => {
  const p1 = cleanNum(fromPrice);
  const p2 = cleanNum(toPrice);

  if (p1 <= 0 || p2 <= 0) return 0;
  if (Math.abs(p2 - p1) < 0.0001) return 0;

  const isUp = p2 >= p1;
  let curr = alignToTick(Math.min(p1, p2), assetType, symbol);
  const target = alignToTick(Math.max(p1, p2), assetType, symbol);
  
  let ticks = 0;
  let safetyCounter = 0;

  while (curr < target - 0.0001 && safetyCounter < 10000) {
    const step = getTickSize(curr, assetType, symbol);
    curr = roundTo(curr + step, 2);
    ticks++;
    safetyCounter++;
  }

  return isUp ? ticks : -ticks;
};

/**
 * 3.3 保本價格計算演算法
 */
export const calcBreakEvenPrice = (
  buyPrice: number,
  discount: number | undefined,
  minFee: number | undefined,
  shares: number,
  assetType?: AssetType,
  tradeType?: TradeTypeOption,
  globalDiscount: number = 0.38,
  symbol?: string
): number => {
  const bp = cleanNum(buyPrice);
  const s = cleanNum(shares, 1000);

  if (bp <= 0 || s <= 0) return 0;

  // 1. 買進總成本 (含買入手續費)
  const buyFee = calcTradeDetails(bp, s, discount, minFee, true, assetType, tradeType, globalDiscount).fee;
  const totalBuyCost = (bp * s) + buyFee;

  // 2. 預估理論保本價 (無捨去)
  const effDiscount = (discount !== undefined && discount !== null) ? discount : globalDiscount;
  const discountFeeRate = 0.001425 * effDiscount;
  const taxRate = (assetType === 'ETF' || (symbol && symbol.startsWith('00'))) 
    ? 0.001 
    : (tradeType?.includes('當沖') ? 0.0015 : 0.003);
  
  const rawBreakEven = (totalBuyCost / s) / (1 - discountFeeRate - taxRate);

  // 3. 向上對齊至 Tick 邊界
  let tick = getTickSize(rawBreakEven, assetType, symbol);
  let candidate = roundTo(Math.ceil(rawBreakEven / tick) * tick, 2);

  // 4. 驗證與微調迴圈
  let attempts = 0;
  while (attempts < 200) {
    const sellObj = calcTradeDetails(candidate, s, discount, minFee, false, assetType, tradeType, globalDiscount);
    const proceeds = (candidate * s) - sellObj.fee - sellObj.tax;
    if (proceeds >= totalBuyCost) {
      break;
    }
    candidate = roundTo(candidate + getTickSize(candidate, assetType, symbol), 2);
    attempts++;
  }

  return candidate;
};

/**
 * 3.4 信用交易維持率與斷頭預警計算
 */
export const calcMarginMaintenanceRatio = (
  buyOrSellPrice: number,
  currentPrice: number,
  shares: number,
  tradeType?: string,
  marginRate: number = 0.6,
  shortMarginRate: number = 0.9
): MaintenanceRatioResult | null => {
  const p = cleanNum(buyOrSellPrice);
  const cp = cleanNum(currentPrice);
  const s = cleanNum(shares);

  if (p <= 0 || cp <= 0 || s <= 0 || !tradeType) return null;

  const isMarginLong = tradeType.includes('資');
  const isMarginShort = tradeType.includes('券');

  if (!isMarginLong && !isMarginShort) return null;

  let ratio = 0;
  let loanOrCollateralAmount = 0;
  let liabilityAmount = 0;
  let liquidationPrice = 0;
  let initialRatio = 100;

  if (isMarginLong) {
    loanOrCollateralAmount = Math.floor(p * s * marginRate);
    liabilityAmount = cp * s;
    ratio = loanOrCollateralAmount > 0 ? (liabilityAmount / loanOrCollateralAmount) * 100 : 0;
    liquidationPrice = roundTo(p * marginRate * 1.3, 2);
    initialRatio = (1 / marginRate) * 100;
  } else {
    loanOrCollateralAmount = Math.floor(p * s * (1 + shortMarginRate));
    liabilityAmount = cp * s;
    ratio = liabilityAmount > 0 ? (loanOrCollateralAmount / liabilityAmount) * 100 : 0;
    liquidationPrice = roundTo((p * (1 + shortMarginRate)) / 1.3, 2);
    initialRatio = (1 + shortMarginRate) * 100;
  }

  const roundedRatio = roundTo(ratio, 2);

  let status: MaintenanceRatioResult['status'] = 'safe';
  let statusLabel = '維持安全';
  let badgeClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  let textClass = 'text-emerald-400';

  if (roundedRatio < 130) {
    status = 'danger';
    statusLabel = '斷頭追繳';
    badgeClass = 'bg-rose-600 text-white font-bold animate-pulse';
    textClass = 'text-rose-500';
  } else if (roundedRatio < 140) {
    status = 'warning';
    statusLabel = '追繳預警';
    badgeClass = 'bg-amber-500 text-slate-950 font-bold';
    textClass = 'text-amber-400';
  } else if (roundedRatio < 160) {
    status = 'caution';
    statusLabel = '警戒觀察';
    badgeClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    textClass = 'text-blue-400';
  }

  return {
    ratio: roundedRatio,
    formattedRatio: `${roundedRatio.toFixed(2)}%`,
    loanOrCollateralAmount,
    liabilityAmount,
    liquidationPrice,
    initialRatio,
    status,
    statusLabel,
    badgeClass,
    textClass,
    isMarginLong,
    isMarginShort,
    marginRate,
    shortMarginRate,
  };
};

/**
 * 計算整戶信用交易擔保維持率
 */
export const calcAccountMarginMaintenanceRatio = (
  holdings: Array<{
    currentPrice: number;
    buyPrice: number;
    shares: number;
    tradeType?: string;
  }>
): number => {
  let totalNumerator = 0;
  let totalDenominator = 0;

  holdings.forEach(h => {
    if (!h.tradeType) return;
    const cp = cleanNum(h.currentPrice);
    const bp = cleanNum(h.buyPrice);
    const s = cleanNum(h.shares);

    if (cp <= 0 || bp <= 0 || s <= 0) return;

    if (h.tradeType.includes('資')) {
      const loan = Math.floor(bp * s * 0.6);
      totalNumerator += (cp * s);
      totalDenominator += loan;
    } else if (h.tradeType.includes('券')) {
      const collateral = Math.floor(bp * s * 1.9);
      totalNumerator += collateral;
      totalDenominator += (cp * s);
    }
  });

  if (totalDenominator <= 0) return 0;
  return roundTo((totalNumerator / totalDenominator) * 100, 2);
};
