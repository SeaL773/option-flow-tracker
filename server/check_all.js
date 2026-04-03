const { MongoClient } = require('mongodb');
(async () => {
  const c = await MongoClient.connect('mongodb://localhost:27017');
  const db = c.db('option_flow_school');
  const cols = ['flow_events','sentiments','trades','option_strategies','ticker_symbols','assets','users','watchlists','filter_presets','watchlist_items'];
  for (const name of cols) {
    const doc = await db.collection(name).findOne({});
    if (doc) {
      console.log(`\n=== ${name} ===`);
      console.log('Keys:', Object.keys(doc).join(', '));
      console.log('Sample:', JSON.stringify(doc).slice(0, 300));
    } else {
      console.log(`\n=== ${name} === (empty)`);
    }
  }
  c.close();
})();
