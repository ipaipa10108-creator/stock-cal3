export type AssetType = '股票' | 'ETF';

export type ApiProvider = 'yahoo' | 'twse_mis' | 'twse_openapi' | 'auto';

export type TradeTypeOption = 
  | '多-現股交易'
  | '多-資買券賣'
  | '空-券賣資買'
  | '多-資買資賣'
  | '空-券賣券買'
  | '多-現股當沖'
  | '空-現股當沖';

export interface StockQuote {
  code: string;           // 股票/ETF代號 (如 "2330", "0050")
  name: string;           // 名稱 (如 "台積電")
  price: number;          // 當前成交價 (或收盤價)
  change: number;         // 漲跌價差
  changePct: number;      // 漲跌幅 (%)
  type?: AssetType;       // 資產類型
  nav?: number;           // ETF 預估淨值 (僅 ETF 有效)
  updateTime?: string;    // 最後更新時間
}

export interface HoldingLot {
  id: string;             // 批次買進 ID (UUID v4)
  buyPrice: number;       // 買入單價 (> 0)
  shares: number;         // 買入股數 (整數 > 0)
  date: string;           // ISO 日期格式 "YYYY-MM-DD"
  tradeType?: TradeTypeOption;
  discount?: number;      // 個別券商折數 (如 0.38)
  minFee?: number;        // 最低手續費 (預設 20)
  isSellLot?: boolean;    // 是否已賣出
  sellPrice?: number;     // 賣出價格
  note?: string;
}

export interface HoldingActivityLog {
  id: string;
  timestamp: string;      // ISO 8601 時間戳
  date: string;           // "YYYY-MM-DD"
  action: 'sell' | 'restore' | 'split' | 'unsplit' | 'edit_lot' | 'add_lot';
  shares: number;
  price: number;
  avgBuyPrice?: number;
  note?: string;
}

export interface HoldingItem {
  id: string;             // 部位唯一 ID
  symbol: string;         // 代號
  name: string;           // 名稱
  buyPrice: number;       // 加權平均買價
  currentPrice: number;   // 當前最新市價
  shares: number;         // 總持股股數
  discount?: number;      // 個別折數 (若無則套用全局)
  minFee?: number;        // 最低手續費
  assetType?: AssetType;
  tradeType?: TradeTypeOption;
  date: string;           // 首次建立日期
  flashClass?: string;    // UI 價格更新動畫效果 Class
  nav?: number;           // ETF 淨值
  lots?: HoldingLot[];    // 分批買進細項明細
  pinned?: boolean;       // 是否置頂釘選
  orderIndex?: number;    // 自訂排序索引
  activityLogs?: HoldingActivityLog[];
}

export interface ComputedHolding extends HoldingItem {
  buyCost: number;         // 總買進成本 (含買入手續費)
  estProceeds: number;     // 預估賣出淨回收額 (扣除賣出手續費與證交稅)
  marketValue: number;     // 當前股票總市值 (currentPrice * shares)
  unrealizedPnl: number;   // 未實現損益 (金額)
  unrealizedPnlPct: number;// 未實現報酬率 (%)
  breakEvenPrice: number;  // 保本價格
  ticksToBreakEven: number;// 距離保本價差幾檔
}

export interface HistoryItem {
  id: string;             // 歷史紀錄 ID
  symbol: string;
  name: string;
  buyPrice: number;       // 平均買價
  sellPrice: number;      // 賣出價格
  shares: number;         // 賣出股數
  realizedPnl: number;    // 已實現損益 (金額)
  returnPct: number;      // 實現報酬率 (%)
  buyDate: string;        // "YYYY-MM-DD"
  sellDate: string;       // "YYYY-MM-DD"
  tradeType?: TradeTypeOption;
  assetType?: AssetType;
  discount?: number;
  minFee?: number;
  lots?: HoldingLot[];
  activityLogs?: HoldingActivityLog[];
}

export interface MaintenanceRatioResult {
  ratio: number;                   // 維持率百分比
  formattedRatio: string;          // "166.67%"
  loanOrCollateralAmount: number;  // 融資借款金額 或 融券擔保品總額
  liabilityAmount: number;         // 負債金額
  liquidationPrice: number;        // 130% 斷頭追繳觸發價格
  initialRatio: number;            // 初始維持率
  status: 'safe' | 'caution' | 'warning' | 'danger';
  statusLabel: string;             // "維持安全" | "警戒觀察" | "追繳預警" | "斷頭追繳"
  badgeClass: string;              // UI 樣式名稱
  textClass: string;               // 文字顏色 Class
  isMarginLong: boolean;
  isMarginShort: boolean;
  marginRate: number;              // 融資成數
  shortMarginRate: number;         // 融券保證金成數
}

export interface Account {
  id: string;             // 帳號 ID
  name: string;           // 帳號名稱
}

export interface HoldingDisplaySettings {
  showTickInfo: boolean;
  showEtfDiscount: boolean;
  showBreakEvenPrice: boolean;
  showFeeTaxDetails: boolean;
  showLotDetails: boolean;
  showActivityLogs: boolean;
  showMarginMaintenanceRatio?: boolean;
}

export interface StockDictEntry {
  symbol: string;
  name: string;
  type: AssetType;
  market: 'TWSE' | 'TPEx';
  price?: number;
}
