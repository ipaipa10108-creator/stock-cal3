import type { StockQuote, ApiProvider } from '../types/stock';
import { findStockInDictionary } from '../db/stockDictionary';

/**
 * 透過多重 CORS Proxy 嘗試發起網路請求 (Circuit Breaker & Proxy Escalation)
 */
async function fetchWithProxy(url: string, timeoutMs: number = 3500): Promise<any> {
  const freshUrl = `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Direct fetch
    const resp = await fetch(freshUrl, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  // Proxies list
  const proxies = [
    (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
    (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
  ];

  for (const proxyFn of proxies) {
    const proxyUrl = proxyFn(url);
    const pController = new AbortController();
    const pTimeout = setTimeout(() => pController.abort(), timeoutMs);
    try {
      const resp = await fetch(proxyUrl, { signal: pController.signal });
      clearTimeout(pTimeout);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      clearTimeout(pTimeout);
    }
  }

  throw new Error(`Failed to fetch from ${url} across all proxies.`);
}

/**
 * 從 TWSE MIS 抓取即時行情 (0-delay 盤中數據)
 */
export async function fetchTwseMisQuotesBatch(symbols: string[]): Promise<Record<string, StockQuote>> {
  if (symbols.length === 0) return {};

  const channelQuery = symbols.map(s => {
    const prefix = s.startsWith('00') || parseInt(s) < 6000 ? 'tse' : 'otc';
    return `${prefix}_${s}.tw`;
  }).join('|');

  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${channelQuery}&json=1&delay=0`;
  const result: Record<string, StockQuote> = {};

  try {
    const data = await fetchWithProxy(url);
    if (data && data.msgArray && Array.isArray(data.msgArray)) {
      data.msgArray.forEach((item: any) => {
        const code = item.c;
        if (!code) return;

        const rawPrice = item.z !== '-' ? parseFloat(item.z) : (item.y !== '-' ? parseFloat(item.y) : undefined);
        const dictMatch = findStockInDictionary(code);
        const name = item.n || item.nf || dictMatch?.name || code;
        const price = rawPrice ?? dictMatch?.price ?? 0;
        const prevClose = item.y !== '-' ? parseFloat(item.y) : price;
        const change = price && prevClose ? parseFloat((price - prevClose).toFixed(2)) : 0;
        const changePct = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
        const isEtf = code.startsWith('00') || dictMatch?.type === 'ETF';

        result[code] = {
          code,
          name,
          price,
          change,
          changePct,
          type: isEtf ? 'ETF' : '股票',
          updateTime: new Date().toLocaleTimeString(),
        };
      });
    }
  } catch (e) {
    console.warn('TWSE MIS batch fetch failed, falling back to dictionary/Yahoo...', e);
  }

  return result;
}

/**
 * 從 Yahoo Finance 抓取即時/盤後行情
 */
export async function fetchYahooQuotesBatch(symbols: string[]): Promise<Record<string, StockQuote>> {
  if (symbols.length === 0) return {};
  const result: Record<string, StockQuote> = {};

  const fetchPromises = symbols.map(async (code) => {
    const dictMatch = findStockInDictionary(code);
    const yahooSymbol = `${code}.TW`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d`;

    try {
      const data = await fetchWithProxy(url);
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta) {
        const price = meta.regularMarketPrice ?? dictMatch?.price ?? 0;
        const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = parseFloat((price - prevClose).toFixed(2));
        const changePct = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
        const isEtf = code.startsWith('00') || dictMatch?.type === 'ETF';

        result[code] = {
          code,
          name: dictMatch?.name || code,
          price,
          change,
          changePct,
          type: isEtf ? 'ETF' : '股票',
          updateTime: new Date().toLocaleTimeString(),
        };
      }
    } catch (e) {
      // Ignore individual failures
    }
  });

  await Promise.allSettled(fetchPromises);
  return result;
}

/**
 * 抓取單一股票即時行情與名稱 (自動帶入用)
 */
export async function fetchSingleStockQuote(symbol: string): Promise<StockQuote> {
  const code = symbol.trim().toUpperCase();
  const dictMatch = findStockInDictionary(code);

  const fallbackQuote: StockQuote = {
    code,
    name: dictMatch?.name || code,
    price: dictMatch?.price || 100,
    change: 0,
    changePct: 0,
    type: dictMatch?.type || (code.startsWith('00') ? 'ETF' : '股票'),
    updateTime: new Date().toLocaleTimeString(),
  };

  if (!code) return fallbackQuote;

  try {
    const misQuotes = await fetchTwseMisQuotesBatch([code]);
    if (misQuotes[code] && misQuotes[code].price > 0) {
      return misQuotes[code];
    }

    const yahooQuotes = await fetchYahooQuotesBatch([code]);
    if (yahooQuotes[code] && yahooQuotes[code].price > 0) {
      return yahooQuotes[code];
    }
  } catch (e) {
    console.warn(`Fetch quote for ${code} failed, using local dictionary...`, e);
  }

  return fallbackQuote;
}

/**
 * 依策略調度多檔股票行情 (`fetchQuotesByProvider`)
 */
export async function fetchQuotesByProvider(
  symbols: string[],
  provider: ApiProvider = 'auto'
): Promise<Record<string, StockQuote>> {
  if (symbols.length === 0) return {};

  const cleanSymbols = Array.from(new Set(symbols.map(s => s.trim().toUpperCase())));
  let quotesMap: Record<string, StockQuote> = {};

  if (provider === 'auto' || provider === 'twse_mis') {
    quotesMap = await fetchTwseMisQuotesBatch(cleanSymbols);
  }

  const missingSymbols = cleanSymbols.filter(s => !quotesMap[s] || quotesMap[s].price <= 0);
  if (missingSymbols.length > 0 && (provider === 'auto' || provider === 'yahoo')) {
    const yahooMap = await fetchYahooQuotesBatch(missingSymbols);
    Object.assign(quotesMap, yahooMap);
  }

  cleanSymbols.forEach(code => {
    if (!quotesMap[code] || quotesMap[code].price <= 0) {
      const dictMatch = findStockInDictionary(code);
      quotesMap[code] = {
        code,
        name: dictMatch?.name || code,
        price: dictMatch?.price || 100,
        change: 0,
        changePct: 0,
        type: dictMatch?.type || (code.startsWith('00') ? 'ETF' : '股票'),
        updateTime: new Date().toLocaleTimeString(),
      };
    }
  });

  return quotesMap;
}
