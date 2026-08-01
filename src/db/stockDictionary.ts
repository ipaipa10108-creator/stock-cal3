import type { StockDictEntry } from '../types/stock';

export const STOCK_DICTIONARY: StockDictEntry[] = [
  // 權值股
  { symbol: '2330', name: '台積電', type: '股票', market: 'TWSE', price: 960 },
  { symbol: '2317', name: '鴻海', type: '股票', market: 'TWSE', price: 180 },
  { symbol: '2454', name: '聯發科', type: '股票', market: 'TWSE', price: 1220 },
  { symbol: '2308', name: '台達電', type: '股票', market: 'TWSE', price: 390 },
  { symbol: '2382', name: '廣達', type: '股票', market: 'TWSE', price: 270 },
  { symbol: '3711', name: '日月光投控', type: '股票', market: 'TWSE', price: 155 },
  { symbol: '2412', name: '中華電', type: '股票', market: 'TWSE', price: 120 },
  { symbol: '2881', name: '富邦金', type: '股票', market: 'TWSE', price: 88 },
  { symbol: '2882', name: '國泰金', type: '股票', market: 'TWSE', price: 62 },
  { symbol: '2891', name: '中信金', type: '股票', market: 'TWSE', price: 36.5 },
  { symbol: '2886', name: '兆豐金', type: '股票', market: 'TWSE', price: 39.5 },
  { symbol: '2884', name: '玉山金', type: '股票', market: 'TWSE', price: 28 },
  { symbol: '1301', name: '台塑', type: '股票', market: 'TWSE', price: 46 },
  { symbol: '1303', name: '南亞', type: '股票', market: 'TWSE', price: 42 },
  { symbol: '2002', name: '中鋼', type: '股票', market: 'TWSE', price: 23 },
  { symbol: '2303', name: '聯電', type: '股票', market: 'TWSE', price: 53.5 },
  { symbol: '3008', name: '大立光', type: '股票', market: 'TWSE', price: 2750 },
  { symbol: '6669', name: '緯穎', type: '股票', market: 'TWSE', price: 2100 },
  { symbol: '3231', name: '緯創', type: '股票', market: 'TWSE', price: 102 },
  { symbol: '2357', name: '華碩', type: '股票', market: 'TWSE', price: 520 },
  { symbol: '2379', name: '瑞昱', type: '股票', market: 'TWSE', price: 540 },
  { symbol: '3034', name: '聯詠', type: '股票', market: 'TWSE', price: 510 },
  { symbol: '3443', name: '創意', type: '股票', market: 'TWSE', price: 1350 },
  { symbol: '3661', name: '世芯-KY', type: '股票', market: 'TWSE', price: 2600 },
  { symbol: '2603', name: '長榮', type: '股票', market: 'TWSE', price: 185 },
  { symbol: '2609', name: '陽明', type: '股票', market: 'TWSE', price: 63.5 },
  { symbol: '2615', name: '萬海', type: '股票', market: 'TWSE', price: 82 },
  { symbol: '2618', name: '長榮航', type: '股票', market: 'TWSE', price: 36.8 },

  // 熱門 ETF
  { symbol: '0050', name: '元大台灣50', type: 'ETF', market: 'TWSE', price: 188.5 },
  { symbol: '0056', name: '元大高股息', type: 'ETF', market: 'TWSE', price: 38.2 },
  { symbol: '00878', name: '國泰永續高股息', type: 'ETF', market: 'TWSE', price: 22.8 },
  { symbol: '00919', name: '群益台灣精選高息', type: 'ETF', market: 'TWSE', price: 25.1 },
  { symbol: '00929', name: '復華台灣科技優息', type: 'ETF', market: 'TWSE', price: 19.8 },
  { symbol: '00940', name: '元大台灣價值高息', type: 'ETF', market: 'TWSE', price: 9.6 },
  { symbol: '006208', name: '富邦台50', type: 'ETF', market: 'TWSE', price: 110.5 },
  { symbol: '00713', name: '元大台灣高息低波', type: 'ETF', market: 'TWSE', price: 57.8 },
  { symbol: '00939', name: '統一台灣高息動能', type: 'ETF', market: 'TWSE', price: 14.5 },
  { symbol: '00918', name: '大華優利高股息30', type: 'ETF', market: 'TWSE', price: 24.2 },
  { symbol: '00881', name: '國泰台灣5G+', type: 'ETF', market: 'TWSE', price: 22.5 },
  { symbol: '00830', name: '國泰費城半導體', type: 'ETF', market: 'TWSE', price: 42.0 },
  { symbol: '00675L', name: '富邦臺灣加權正2', type: 'ETF', market: 'TWSE', price: 215.0 },
  { symbol: '00632R', name: '元大台灣50反1', type: 'ETF', market: 'TWSE', price: 3.45 },
  { symbol: '00757', name: '統一FANG+', type: 'ETF', market: 'TWSE', price: 88.0 },
  { symbol: '00923', name: '群益台ESG低碳50', type: 'ETF', market: 'TWSE', price: 21.2 },
  { symbol: '00935', name: '野村臺灣新科技50', type: 'ETF', market: 'TWSE', price: 21.8 },
  { symbol: '00941', name: '中信上游半導體', type: 'ETF', market: 'TWSE', price: 15.2 },
];

export const searchStockDictionary = (query: string): StockDictEntry[] => {
  if (!query || query.trim() === '') return [];
  const q = query.trim().toLowerCase();
  
  return STOCK_DICTIONARY.filter(item => 
    item.symbol.toLowerCase().includes(q) || 
    item.name.toLowerCase().includes(q)
  ).slice(0, 10);
};

export const findStockInDictionary = (symbol: string): StockDictEntry | undefined => {
  if (!symbol) return undefined;
  const s = symbol.trim();
  return STOCK_DICTIONARY.find(item => item.symbol.toLowerCase() === s.toLowerCase());
};
