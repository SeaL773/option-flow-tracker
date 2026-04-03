const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('option_flow_school');

  // 1. flow_events: remove 'type' and 'expirations', flatten strike_price arrays
  console.log('=== Updating flow_events ===');

  // strikes was already renamed in previous run. Remove type + expirations in one go
  let r = await db.collection('flow_events').updateMany(
    {},
    { $unset: { type: '', expirations: '' } }
  );
  console.log(`  Removed type + expirations: ${r.modifiedCount} docs`);

  // Flatten strike_price: use aggregation pipeline update (much faster than per-doc)
  r = await db.collection('flow_events').updateMany(
    { strike_price: { $type: 'array' } },
    [{ $set: { strike_price: { $arrayElemAt: ['$strike_price', 0] } } }]
  );
  console.log(`  Flattened strike_price arrays: ${r.modifiedCount} docs`);

  // 2. sentiments: remove 'sentiment_level'
  console.log('\n=== Updating sentiments ===');
  const sentiments = await db.collection('sentiments').find({}).toArray();
  sentiments.forEach(s => console.log(`  ${JSON.stringify(s)}`));
  r = await db.collection('sentiments').updateMany({}, { $unset: { sentiment_level: '' } });
  console.log(`  Removed sentiment_level: ${r.modifiedCount} docs`);

  // 3. filter_presets: expand filter_config/filters into atomic fields
  console.log('\n=== Updating filter_presets ===');
  const presets = await db.collection('filter_presets').find({}).toArray();
  console.log(`  Found ${presets.length} presets`);

  for (const preset of presets) {
    console.log(`  Processing: ${preset.name || preset.preset_name || preset._id}`);
    console.log(`    Keys: ${Object.keys(preset).join(', ')}`);
    const fc = preset.filters || preset.filter_config || {};
    console.log(`    Filter config: ${JSON.stringify(fc)}`);
    
    const update = {
      $set: {
        min_premium: fc.minPremium || fc.min_premium || null,
        max_premium: fc.maxPremium || fc.max_premium || null,
        min_volume: fc.minVolume || fc.min_volume || null,
        max_volume: fc.maxVolume || fc.max_volume || null,
        min_oi: fc.minOI || fc.min_oi || null,
        max_oi: fc.maxOI || fc.max_oi || null,
        sentiment_id: fc.sentiment || fc.sentiment_id || null,
        strategy_id: fc.definition || fc.strategy_id || null,
        trade_type_id: fc.type || fc.trade_type_id || null,
      },
      $unset: {
        filter_config: '',
        filters: '',
      }
    };
    await db.collection('filter_presets').updateOne({ _id: preset._id }, update);
    console.log(`    Done`);
  }

  // Verify
  console.log('\n=== Verification ===');
  const sample = await db.collection('flow_events').findOne({});
  console.log('flow_events sample keys:', Object.keys(sample).join(', '));

  const sentSample = await db.collection('sentiments').findOne({});
  console.log('sentiments sample keys:', Object.keys(sentSample).join(', '));

  const presetSample = await db.collection('filter_presets').findOne({});
  if (presetSample) console.log('filter_presets sample keys:', Object.keys(presetSample).join(', '));

  await client.close();
  console.log('\nDone!');
}

main().catch(console.error);
