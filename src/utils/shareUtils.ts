import type { HoldingItem } from '../types/stock';
import { cleanNum } from './stockMath';

/**
 * 格式化單一持股部位為分享文字
 */
export const formatHoldingToShareText = (holding: HoldingItem): string => {
  const lotText = holding.lots && holding.lots.length > 0
    ? holding.lots.map(l => ` - ${l.date}: $${l.buyPrice} (${l.shares}股)`).join('\n')
    : '';

  return `📊 【Stock-Cal 持股分享】
股票/ETF: ${holding.name} (${holding.symbol})
均價: $${holding.buyPrice}
股數: ${holding.shares.toLocaleString()} 股 (${(holding.shares / 1000).toFixed(2)} 張)
交易類型: ${holding.tradeType || '多-現股交易'}
購買日期: ${holding.date}
${lotText ? `分批明細:\n${lotText}\n` : ''}---`;
};

/**
 * 格式化所有庫存持股為剪貼簿文字
 */
export const formatAllHoldingsToShareText = (holdings: HoldingItem[], accountName: string = '預設帳戶'): string => {
  if (holdings.length === 0) return `【${accountName}】目前尚無持股部位。`;

  const header = `📈 【Stock-Cal 庫存持股清單 - ${accountName}】\n匯出時間: ${new Date().toLocaleString()}\n================================\n`;
  const items = holdings.map(formatHoldingToShareText).join('\n\n');
  return `${header}${items}`;
};

/**
 * 4.4 解析社群分享文字，並支援萬股 (張) 單位換算
 */
export const parseShareText = (text: string): Partial<HoldingItem>[] => {
  if (!text || text.trim() === '') return [];

  const results: Partial<HoldingItem>[] = [];
  const blocks = text.split(/(?:================================|---|\n\s*\n)/);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const symbolMatch = block.match(/(?:股票代號|代號|Symbol|[\(（])[:：\s]*([0-9]{4,6}|[0-9]{5,6}[A-Z]?)[\)）]?/i) 
      || block.match(/\b([0-9]{4,6})\b/);
    const nameMatch = block.match(/(?:股票\/ETF|名稱|Name)[:：\s]*([^\n(\(\$]+)/i);
    const priceMatch = block.match(/(?:買入價格|買價|均價|單價|Price)[:：\s]*[$]*([0-9.]+)/i);
    const sharesMatch = block.match(/(?:股數|數量|Shares)[:：\s]*([0-9,.]+)\s*(張|股)?/i);

    if (symbolMatch || priceMatch || sharesMatch) {
      const symbol = symbolMatch ? symbolMatch[1].trim() : '2330';
      const name = nameMatch ? nameMatch[1].trim() : (symbol === '2330' ? '台積電' : symbol);
      const buyPrice = priceMatch ? cleanNum(priceMatch[1]) : 100;
      
      let rawShares = sharesMatch ? cleanNum(sharesMatch[1].replace(/,/g, '')) : 1000;
      const unit = sharesMatch ? sharesMatch[2] : undefined;

      if (unit === '張' || (sharesMatch && block.includes('張') && rawShares < 100)) {
        rawShares = rawShares * 1000;
      }

      results.push({
        symbol,
        name,
        buyPrice,
        shares: Math.max(1, Math.round(rawShares)),
        currentPrice: buyPrice,
        date: new Date().toISOString().split('T')[0],
        tradeType: '多-現股交易',
      });
    }
  }

  return results;
};
