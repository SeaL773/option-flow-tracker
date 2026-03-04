const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'option_flow_school';

async function seedLookupTables() {
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);

  // 1. Sentiment table
  const sentiments = [
    { sentiment_id: 0, sentiment_name: 'Very Bearish', sentiment_level: -2 },
    { sentiment_id: 1, sentiment_name: 'Bearish', sentiment_level: -1 },
    { sentiment_id: 2, sentiment_name: 'Neutral', sentiment_level: 0 },
    { sentiment_id: 3, sentiment_name: 'Directional', sentiment_level: 0 },
    { sentiment_id: 4, sentiment_name: 'Bullish', sentiment_level: 1 },
    { sentiment_id: 5, sentiment_name: 'Very Bullish', sentiment_level: 2 },
  ];
  await db.collection('sentiments').drop().catch(() => {});
  await db.collection('sentiments').insertMany(sentiments);
  await db.collection('sentiments').createIndex({ sentiment_id: 1 }, { unique: true });
  console.log('✅ sentiments:', sentiments.length);

  // 2. Option_Strategy (trade definitions)
  const strategies = [
    { strategy_id: 0, strategy_name: 'Custom' },
    { strategy_id: 1, strategy_name: 'Call' },
    { strategy_id: 2, strategy_name: 'Put' },
    { strategy_id: 3, strategy_name: 'Call' },
    { strategy_id: 4, strategy_name: 'Put' },
    { strategy_id: 5, strategy_name: 'Covered Call' },
    { strategy_id: 6, strategy_name: 'Protective Put' },
    { strategy_id: 7, strategy_name: 'Bull Call Spread' },
    { strategy_id: 8, strategy_name: 'Bear Call Spread' },
    { strategy_id: 9, strategy_name: 'Bull Put Spread' },
    { strategy_id: 10, strategy_name: 'Bear Put Spread' },
    { strategy_id: 11, strategy_name: 'Call Calendar' },
    { strategy_id: 12, strategy_name: 'Put Calendar' },
    { strategy_id: 13, strategy_name: 'Call Diagonal' },
    { strategy_id: 14, strategy_name: 'Straddle' },
    { strategy_id: 15, strategy_name: 'Strangle' },
    { strategy_id: 16, strategy_name: 'Call Butterfly' },
    { strategy_id: 17, strategy_name: 'Put Butterfly' },
    { strategy_id: 18, strategy_name: 'Iron Butterfly' },
    { strategy_id: 19, strategy_name: 'Iron Condor' },
    { strategy_id: 20, strategy_name: 'Call Condor' },
    { strategy_id: 21, strategy_name: 'Put Condor' },
    { strategy_id: 22, strategy_name: 'Call Ladder' },
    { strategy_id: 23, strategy_name: 'Put Ladder' },
    { strategy_id: 24, strategy_name: 'Jade Lizard' },
    { strategy_id: 25, strategy_name: 'Reverse Jade Lizard' },
    { strategy_id: 26, strategy_name: 'Collar' },
    { strategy_id: 27, strategy_name: 'Combo' },
    { strategy_id: 28, strategy_name: 'Call Ratio Spread' },
    { strategy_id: 29, strategy_name: 'Put Ratio Spread' },
    { strategy_id: 30, strategy_name: 'Call Back Ratio' },
    { strategy_id: 31, strategy_name: 'Put Back Ratio' },
    { strategy_id: 32, strategy_name: 'Conversion' },
    { strategy_id: 33, strategy_name: 'Reversal' },
    { strategy_id: 34, strategy_name: 'Call To Open' },
    { strategy_id: 35, strategy_name: 'Put To Open' },
    { strategy_id: 36, strategy_name: 'Synthetic Long' },
    { strategy_id: 37, strategy_name: 'Synthetic Short' },
    { strategy_id: 38, strategy_name: 'Risk Reversal' },
    { strategy_id: 39, strategy_name: 'Strip' },
    { strategy_id: 40, strategy_name: 'Strap' },
    { strategy_id: 41, strategy_name: 'Guts' },
    { strategy_id: 42, strategy_name: 'Broken Wing Butterfly' },
    { strategy_id: 43, strategy_name: 'Christmas Tree' },
    { strategy_id: 44, strategy_name: 'Reverse Diagonal Call' },
    { strategy_id: 45, strategy_name: 'Reverse Diagonal Put' },
    { strategy_id: 46, strategy_name: 'Put Diagonal' },
    { strategy_id: 101, strategy_name: 'Calls' },
    { strategy_id: 102, strategy_name: 'Puts' },
    { strategy_id: 103, strategy_name: 'Calls' },
    { strategy_id: 104, strategy_name: 'Puts' },
    { strategy_id: 105, strategy_name: 'Calls To Open' },
    { strategy_id: 106, strategy_name: 'Puts To Open' },
    { strategy_id: 107, strategy_name: 'Calls To Open' },
    { strategy_id: 108, strategy_name: 'Puts To Open' },
  ];
  await db.collection('option_strategies').drop().catch(() => {});
  await db.collection('option_strategies').insertMany(strategies);
  await db.collection('option_strategies').createIndex({ strategy_id: 1 }, { unique: true });
  console.log('✅ option_strategies:', strategies.length);

  // 3. Trade (flow types)
  const trades = [
    { trade_type_id: 0, type_name: 'Single' },
    { trade_type_id: 1, type_name: 'Split' },
    { trade_type_id: 2, type_name: 'Sweep' },
    { trade_type_id: 3, type_name: 'Block' },
  ];
  await db.collection('trades').drop().catch(() => {});
  await db.collection('trades').insertMany(trades);
  await db.collection('trades').createIndex({ trade_type_id: 1 }, { unique: true });
  console.log('✅ trades:', trades.length);

  // 4. Asset types
  const assets = [
    { asset_type_id: 0, type_name: 'Stock' },
    { asset_type_id: 1, type_name: 'ETF' },
  ];
  await db.collection('assets').drop().catch(() => {});
  await db.collection('assets').insertMany(assets);
  await db.collection('assets').createIndex({ asset_type_id: 1 }, { unique: true });
  console.log('✅ assets:', assets.length);

  // 5. Ticker_Symbol - extract unique symbols from flow_events
  console.log('Extracting unique symbols from flow_events...');
  const symbols = await db.collection('flow_events').distinct('symbol');
  const tickers = symbols.map((sym, i) => ({
    ticker_id: i + 1,
    symbol: sym,
    company_name: sym, // We don't have company names in the data
    asset_type_id: ['SPY','QQQ','IWM','DIA','XLF','XLE','XLK','GLD','SLV','TLT','EEM','VXX','HYG','XSP','ARKK','KWEB','FXI','EFA','EWZ','USO','GDX','UVXY','SQQQ','TQQQ','SMH','XBI','IBIT','BITO','MSTR'].includes(sym) ? 1 : 0,
  }));
  await db.collection('ticker_symbols').drop().catch(() => {});
  await db.collection('ticker_symbols').insertMany(tickers);
  await db.collection('ticker_symbols').createIndex({ ticker_id: 1 }, { unique: true });
  await db.collection('ticker_symbols').createIndex({ symbol: 1 }, { unique: true });
  console.log('✅ ticker_symbols:', tickers.length);

  client.close();
  console.log('\nAll lookup tables created!');
}

seedLookupTables().catch(console.error);
