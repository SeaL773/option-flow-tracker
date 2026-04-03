const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('option_flow_school');

  // 1. Get all watchlists with tickers
  const watchlists = await db.collection('watchlists').find({}).toArray();
  console.log(`Found ${watchlists.length} watchlists`);

  let totalItems = 0;
  for (const wl of watchlists) {
    console.log(`  ${wl.name}: tickers = ${JSON.stringify(wl.tickers)}`);
    if (wl.tickers && wl.tickers.length > 0) {
      // Look up ticker_id for each symbol
      for (const symbol of wl.tickers) {
        const ticker = await db.collection('ticker_symbols').findOne({ symbol });
        if (ticker) {
          await db.collection('watchlist_items').insertOne({
            watchlist_id: wl._id.toString(),
            ticker_id: ticker.ticker_id,
          });
          totalItems++;
          console.log(`    Inserted: watchlist=${wl._id} ticker=${symbol} (id=${ticker.ticker_id})`);
        } else {
          console.log(`    WARNING: ticker ${symbol} not found in ticker_symbols`);
        }
      }
    }
  }
  console.log(`\nInserted ${totalItems} watchlist_items`);

  // If no items were created (all watchlists empty), seed some sample data
  if (totalItems === 0) {
    console.log('\nAll watchlists had empty tickers. Seeding sample data...');
    // Get some tickers
    const tickers = await db.collection('ticker_symbols').find({}).limit(10).toArray();
    
    for (const wl of watchlists) {
      // Give each watchlist 3-5 random tickers
      const count = Math.min(3 + Math.floor(Math.random() * 3), tickers.length);
      const shuffled = tickers.sort(() => 0.5 - Math.random()).slice(0, count);
      for (const t of shuffled) {
        await db.collection('watchlist_items').insertOne({
          watchlist_id: wl._id.toString(),
          ticker_id: t.ticker_id,
        });
        totalItems++;
        console.log(`  Seeded: watchlist="${wl.name}" ticker=${t.symbol} (id=${t.ticker_id})`);
      }
    }
    console.log(`Seeded ${totalItems} watchlist_items total`);
  }

  // 2. Remove tickers array from watchlists
  const r = await db.collection('watchlists').updateMany({}, { $unset: { tickers: '' } });
  console.log(`\nRemoved 'tickers' array from ${r.modifiedCount} watchlists`);

  // 3. Verify
  console.log('\n=== Verification ===');
  const wlSample = await db.collection('watchlists').findOne({});
  console.log('watchlists keys:', Object.keys(wlSample).join(', '));
  
  const wiCount = await db.collection('watchlist_items').countDocuments({});
  console.log('watchlist_items count:', wiCount);
  
  const wiSample = await db.collection('watchlist_items').find({}).limit(3).toArray();
  wiSample.forEach(wi => console.log('  ', JSON.stringify(wi)));

  await client.close();
  console.log('\nDone!');
}

main().catch(console.error);
