const { MongoClient } = require('mongodb');
(async () => {
  const c = await MongoClient.connect('mongodb://localhost:27017');
  const db = c.db('option_flow_school');
  
  const doc = await db.collection('flow_events').findOne({});
  console.log('expiration:', JSON.stringify(doc.expiration), '| type:', typeof doc.expiration, '| isArray:', Array.isArray(doc.expiration));
  console.log('strike_price:', JSON.stringify(doc.strike_price), '| type:', typeof doc.strike_price, '| isArray:', Array.isArray(doc.strike_price));
  
  const arrExp = await db.collection('flow_events').countDocuments({ expiration: { $type: 'array' } });
  const arrStrike = await db.collection('flow_events').countDocuments({ strike_price: { $type: 'array' } });
  console.log('\nexpiration arrays count:', arrExp);
  console.log('strike_price arrays count:', arrStrike);
  
  // Show a few examples
  if (arrExp > 0) {
    const ex = await db.collection('flow_events').findOne({ expiration: { $type: 'array' } });
    console.log('\nexpiration array example:', JSON.stringify(ex.expiration));
  }
  if (arrStrike > 0) {
    const ex = await db.collection('flow_events').findOne({ strike_price: { $type: 'array' } });
    console.log('strike_price array example:', JSON.stringify(ex.strike_price));
  }
  
  c.close();
})();
