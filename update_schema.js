const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('option_flow_school');

  // 1. flow_events: rename 'strikes' → 'strike_price', remove 'type'
  console.log('=== Updating flow_events ===');
  let r = await db.collection('flow_events').updateMany(
    { strikes: { $exists: true } },
    { $rename: { 'strikes': 'strike_price' } }
  );
  console.log(`  Renamed strikes → strike_price: ${r.modifiedCount} docs`);

  // For strike_price: if it's an array, flatten to first element
  const cursor = db.collection('flow_events').find({ strike_price: { $type: 'array' } });
  let flatCount = 0;
  for await (const doc of cursor) {
    const val = doc.strike_price && doc.strike_price.length > 0 ? doc.strike_price[0] : null;
    await db.collection('flow_events').updateOne(
      { _id: doc._id },
      { $set: { strike_price: val } }
    );
    flatCount++;
  }
  console.log(`  Flattened strike_price arrays: ${flatCount} docs`);

  r = await db.collection('flow_events').updateMany(
    { type: { $exists: true } },
    { $unset: { type: '' } }
  );
  console.log(`  Removed 'type' field: ${r.modifiedCount} docs`);

  // Also remove 'expirations' array if exists (not in schema)
  r = await db.collection('flow_events').updateMany(
    { expirations: { $exists: true } },
    { $unset: { expirations: '' } }
  );
  console.log(`  Removed 'expirations' field: ${r.modifiedCount} docs`);

  // 2. sentiments: remove 'sentiment_level'
  console.log('\n=== Updating sentiments ===');
  // First check what's there
  const sentiments = await db.collection('sentiments').find({}).toArray();
  console.log(`  Current docs: ${sentiments.length}`);
  sentiments.forEach(s => console.log(`    ${JSON.stringify(s)}`));

  r = await db.collection('sentiments').updateMany(
    {},
    { $unset: { sentiment_level: '' } }
  );
  console.log(`  Removed 'sentiment_level': ${r.modifiedCount} docs`);

  // 3. filter_presets: expand filter_config into atomic fields
  console.log('\n=== Updating filter_presets ===');
  const presets = await db.collection('filter_presets').find({}).toArray();
  console.log(`  Found ${presets.length} presets`);

  for (const preset of presets) {
    const fc = preset.filters || preset.filter_config || {};
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
    console.log(`  Updated preset: ${preset.preset_name || preset.name || preset._id}`);
  }

  // Verify
  console.log('\n=== Verification ===');
  const sample = await db.collection('flow_events').findOne({});
  console.log('flow_events sample keys:', Object.keys(sample).join(', '));

  const sentSample = await db.collection('sentiments').findOne({});
  console.log('sentiments sample keys:', Object.keys(sentSample).join(', '));

  const presetSample = await db.collection('filter_presets').findOne({});
  console.log('filter_presets sample keys:', Object.keys(presetSample).join(', '));

  await client.close();
  console.log('\nDone!');
}

main().catch(console.error);
