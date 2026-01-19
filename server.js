// ==================== server.js ====================
// Express-сервер для получения актуальных данных с Yahoo Finance
// Запуск: node server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;
// Включаем CORS для фронтенда
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  methods: ['GET'],
}));

app.use(express.json());

// Список символов акций
const SYMBOLS = ['NVDA', 'INTC', 'AMAT', 'KLAC', 'AMZN', 'GOOGL', 'AVGO', 'AMD', 'AAPL', 'MSFT', 'META', 'TSM', '005930.KS'];

// ==================== API ENDPOINTS ====================

// Получить данные по одной акции
app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    const data = await fetchYahooQuote(symbol);
    if (data) {
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, error: 'Данные не найдены' });
    }
  } catch (error) {
    console.error(`Ошибка для ${symbol}:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить данные по всем акциям
app.get('/api/stocks', async (req, res) => {
  try {
    const results = {};
    const errors = [];
    
    // Запрашиваем данные параллельно
    const promises = SYMBOLS.map(async (symbol) => {
      try {
        const data = await fetchYahooQuote(symbol);
        if (data) {
          results[symbol] = data;
        } else {
          errors.push({ symbol, error: 'Нет данных' });
        }
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    });
    
    await Promise.all(promises);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Ошибка при получении данных:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить данные по выбранным акциям
app.get('/api/stocks/batch', async (req, res) => {
  const { symbols } = req.query;
  
  if (!symbols) {
    return res.status(400).json({ success: false, error: 'Укажите параметр symbols' });
  }
  
  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const results = {};
  const errors = [];
  
  try {
    const promises = symbolList.map(async (symbol) => {
      try {
        const data = await fetchYahooQuote(symbol);
        if (data) {
          results[symbol] = data;
        } else {
          errors.push({ symbol, error: 'Нет данных' });
        }
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    });
    
    await Promise.all(promises);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== YAHOO FINANCE API ====================

async function fetchYahooQuote(symbol) {
  // Метод 1: Yahoo Finance v8 chart API
  try {
    const chartData = await fetchChartData(symbol);
    const summaryData = await fetchSummaryData(symbol);
    
    // Объединяем данные из обоих источников
    return {
      symbol,
      ...chartData,
      ...summaryData,
    };
  } catch (error) {
    console.error(`fetchYahooQuote error for ${symbol}:`, error.message);
    
    // Пробуем альтернативный метод
    try {
      return await fetchChartDataOnly(symbol);
    } catch (fallbackError) {
      throw new Error(`Не удалось получить данные для ${symbol}`);
    }
  }
}

// Получение базовых данных через chart API
async function fetchChartData(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const result = data.chart?.result?.[0];
  
  if (!result) {
    throw new Error('Пустой ответ от API');
  }
  
  const meta = result.meta;
  const quote = result.indicators?.quote?.[0];
  
  // Рассчитываем изменение за день
  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.previousClose || meta.chartPreviousClose;
  const changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
  
  return {
    price: currentPrice,
    previousClose,
    changePercent,
    change: currentPrice - previousClose,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
    currency: meta.currency,
    exchange: meta.exchangeName,
    marketState: meta.marketState,
  };
}

// Получение детальных данных через quoteSummary API
async function fetchSummaryData(symbol) {
  const modules = 'price,summaryDetail,defaultKeyStatistics,financialData';
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.warn(`Summary API вернул ${response.status} для ${symbol}`);
    return {};
  }
  
  const data = await response.json();
  const result = data.quoteSummary?.result?.[0];
  
  if (!result) {
    return {};
  }
  
  const price = result.price || {};
  const summary = result.summaryDetail || {};
  const keyStats = result.defaultKeyStatistics || {};
  const financial = result.financialData || {};
  
  return {
    // Рыночные данные
    marketCap: price.marketCap?.raw,
    enterpriseValue: keyStats.enterpriseValue?.raw,
    
    // Оценка
    pe: summary.trailingPE?.raw || keyStats.trailingPE?.raw,
    forwardPe: summary.forwardPE?.raw || keyStats.forwardPE?.raw,
    peg: keyStats.pegRatio?.raw,
    priceToBook: keyStats.priceToBook?.raw,
    priceToSales: summary.priceToSalesTrailing12Months?.raw,
    
    // Дивиденды
    dividendYield: summary.dividendYield?.raw,
    dividendRate: summary.dividendRate?.raw,
    exDividendDate: summary.exDividendDate?.fmt,
    payoutRatio: summary.payoutRatio?.raw,
    
    // Рост и прибыльность
    revenueGrowth: financial.revenueGrowth?.raw,
    earningsGrowth: financial.earningsGrowth?.raw,
    profitMargins: financial.profitMargins?.raw,
    operatingMargins: financial.operatingMargins?.raw,
    grossMargins: financial.grossMargins?.raw,
    
    // Финансовое здоровье
    totalCash: financial.totalCash?.raw,
    totalDebt: financial.totalDebt?.raw,
    currentRatio: financial.currentRatio?.raw,
    quickRatio: financial.quickRatio?.raw,
    debtToEquity: financial.debtToEquity?.raw,
    
    // EPS
    trailingEps: keyStats.trailingEps?.raw,
    forwardEps: keyStats.forwardEps?.raw,
    
    // Волатильность
    beta: summary.beta?.raw,
    
    // Объёмы
    averageVolume: summary.averageVolume?.raw,
    averageVolume10days: summary.averageVolume10days?.raw,
    
    // Цели аналитиков
    targetHighPrice: financial.targetHighPrice?.raw,
    targetLowPrice: financial.targetLowPrice?.raw,
    targetMeanPrice: financial.targetMeanPrice?.raw,
    recommendationMean: financial.recommendationMean?.raw,
    recommendationKey: financial.recommendationKey,
    numberOfAnalystOpinions: financial.numberOfAnalystOpinions?.raw,
    
    // Даты
    lastFiscalYearEnd: keyStats.lastFiscalYearEnd?.fmt,
    nextFiscalYearEnd: keyStats.nextFiscalYearEnd?.fmt,
    mostRecentQuarter: keyStats.mostRecentQuarter?.fmt,
  };
}

// Fallback: только chart данные
async function fetchChartDataOnly(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const result = data.chart?.result?.[0];
  
  if (!result) {
    throw new Error('Нет данных');
  }
  
  const meta = result.meta;
  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.previousClose || meta.chartPreviousClose;
  
  return {
    symbol,
    price: currentPrice,
    previousClose,
    changePercent: previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
    change: currentPrice - previousClose,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
    volume: meta.regularMarketVolume,
    marketCap: null,
    pe: null,
  };
}

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    symbols: SYMBOLS,
  });
});

// ==================== ЗАПУСК СЕРВЕРА ====================


// ===== Serve frontend (Vite build) in production =====
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: serve index.html for all non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Сервер запущен на http://localhost:${PORT}          ║
║                                                        ║
║   API Endpoints:                                       ║
║   GET /api/health         - Проверка статуса           ║
║   GET /api/stocks         - Все акции                  ║
║   GET /api/stock/:symbol  - Одна акция                 ║
║   GET /api/stocks/batch?symbols=NVDA,AAPL              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
