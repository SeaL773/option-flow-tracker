const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4001;
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'option_flow_school';
const JWT_SECRET = 'option-flow-school-secret-key-cs4604';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);

  // Ensure indexes on flow_events
  const flowEvents = db.collection('flow_events');
  await flowEvents.createIndex({ date: -1 });
  await flowEvents.createIndex({ symbol: 1 });
  await flowEvents.createIndex({ date: -1, premium: -1 });
  await flowEvents.createIndex({ _id: 1, date: -1 });

  // Ensure indexes on users
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });

  console.log('Indexes ensured');
}

// ============================================================
// Auth Middleware
// ============================================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Optional auth - attaches user if token present, but doesn't block
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  next();
}

// ============================================================
// Auth Routes
// ============================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = db.collection('users');
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'trader', // Default role: trader (retail trader)
      createdAt: new Date(),
    };

    const result = await users.insertOne(user);
    const token = jwt.sign(
      { userId: result.insertedId.toString(), email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: result.insertedId, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = db.collection('users');
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

// ============================================================
// Flow Events Routes
// ============================================================

app.get('/api/options', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 10000);
    const flowEvents = db.collection('flow_events');

    const history = await flowEvents
      .find({})
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    // Map _id to code for frontend compatibility
    const mapped = history.map(doc => ({
      ...doc,
      code: doc._id,
    }));

    res.json({ history: mapped });
  } catch (err) {
    console.error('Options error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/options-before', optionalAuth, async (req, res) => {
  try {
    const { code, limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr) || 1000, 10000);

    if (!code) {
      return res.status(400).json({ error: 'code parameter required' });
    }

    const flowEvents = db.collection('flow_events');

    // Find the reference document to get its date
    const refDoc = await flowEvents.findOne({ _id: code });
    if (!refDoc) {
      return res.json({ history: [] });
    }

    // Get documents older than the reference
    const history = await flowEvents
      .find({
        $or: [
          { date: { $lt: refDoc.date } },
          { date: refDoc.date, _id: { $lt: code } },
        ],
      })
      .sort({ date: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const mapped = history.map(doc => ({
      ...doc,
      code: doc._id,
    }));

    res.json({ history: mapped });
  } catch (err) {
    console.error('Options-before error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/options-since', optionalAuth, async (req, res) => {
  // Static database - no new data
  res.json({ history: [] });
});

app.get('/api/check-new-data', optionalAuth, async (req, res) => {
  // Static database - never has new data
  res.json({ hasNewData: false });
});

// ============================================================
// Tickers Route
// ============================================================

app.get('/api/tickers', optionalAuth, async (req, res) => {
  try {
    const flowEvents = db.collection('flow_events');

    // Aggregate unique symbols with count
    const tickers = await flowEvents
      .aggregate([
        { $group: { _id: '$symbol', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    // Build tickers map compatible with frontend
    const tickersMap = {};
    tickers.forEach(t => {
      const symbol = t._id;
      const isFuture = symbol.startsWith('/');
      const isETF = isFuture || ['SPY', 'QQQ', 'IWM', 'DIA', 'GLD', 'SLV', 'TLT', 'XLF', 'XLE', 'XLK', 'XLV', 'XLI', 'XLP', 'XLU', 'XLB', 'XLRE', 'XLC', 'VXX', 'UVXY', 'SQQQ', 'TQQQ', 'ARKK', 'HYG', 'EEM', 'EFA', 'IBIT', 'BITO', 'USO', 'UNG', 'KWEB', 'FXI', 'SMH', 'SOXX', 'XBI', 'IBB', 'KRE', 'JETS', 'GDXJ', 'GDX'].includes(symbol);
      tickersMap[symbol] = {
        etf: isETF,
        mc: null, // Market cap not available in static data
        er: null, // Earnings date not available
      };
    });

    res.json({ tickers: tickersMap });
  } catch (err) {
    console.error('Tickers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// Watchlist Routes
// ============================================================

app.get('/api/watchlists', authMiddleware, async (req, res) => {
  try {
    const watchlists = db.collection('watchlists');
    const lists = await watchlists
      .find({ userId: req.user.userId })
      .sort({ createdAt: 1 })
      .toArray();

    // If user has no watchlists, create a default one
    if (lists.length === 0) {
      const defaultList = {
        userId: req.user.userId,
        name: 'Watch List',
        tickers: [],
        createdAt: new Date(),
      };
      const result = await watchlists.insertOne(defaultList);
      defaultList._id = result.insertedId;
      return res.json([{ id: defaultList._id.toString(), name: defaultList.name, tickers: defaultList.tickers }]);
    }

    res.json(lists.map(l => ({ id: l._id.toString(), name: l.name, tickers: l.tickers })));
  } catch (err) {
    console.error('Get watchlists error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/watchlists', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const watchlists = db.collection('watchlists');
    const newList = {
      userId: req.user.userId,
      name: name.trim(),
      tickers: [],
      createdAt: new Date(),
    };

    const result = await watchlists.insertOne(newList);
    res.status(201).json({ id: result.insertedId.toString(), name: newList.name, tickers: [] });
  } catch (err) {
    console.error('Create watchlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/watchlists/:id', authMiddleware, async (req, res) => {
  try {
    const { name, tickers } = req.body;
    const watchlists = db.collection('watchlists');

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (tickers !== undefined) update.tickers = tickers;

    const result = await watchlists.updateOne(
      { _id: new ObjectId(req.params.id), userId: req.user.userId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update watchlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/watchlists/:id', authMiddleware, async (req, res) => {
  try {
    const watchlists = db.collection('watchlists');
    const result = await watchlists.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete watchlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/watchlists/:id/tickers', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const watchlists = db.collection('watchlists');
    const result = await watchlists.updateOne(
      { _id: new ObjectId(req.params.id), userId: req.user.userId },
      { $addToSet: { tickers: symbol.toUpperCase().trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Add ticker error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/watchlists/:id/tickers/:symbol', authMiddleware, async (req, res) => {
  try {
    const watchlists = db.collection('watchlists');
    const result = await watchlists.updateOne(
      { _id: new ObjectId(req.params.id), userId: req.user.userId },
      { $pull: { tickers: req.params.symbol } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Remove ticker error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// Filter Preset Routes
// ============================================================

app.get('/api/presets', authMiddleware, async (req, res) => {
  try {
    const presets = db.collection('filter_presets');
    const lists = await presets
      .find({ userId: req.user.userId })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(
      lists.map(p => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description || '',
        color: p.color || '#60a5fa',
        criteria: p.criteria,
      }))
    );
  } catch (err) {
    console.error('Get presets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/presets', authMiddleware, async (req, res) => {
  try {
    const { name, description, color, criteria } = req.body;
    if (!name || !criteria) {
      return res.status(400).json({ error: 'Name and criteria are required' });
    }

    const presets = db.collection('filter_presets');
    const preset = {
      userId: req.user.userId,
      name: name.trim(),
      description: description || '',
      color: color || '#60a5fa',
      criteria,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await presets.insertOne(preset);
    res.status(201).json({
      id: result.insertedId.toString(),
      name: preset.name,
      description: preset.description,
      color: preset.color,
      criteria: preset.criteria,
    });
  } catch (err) {
    console.error('Create preset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/presets/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, color, criteria } = req.body;
    const presets = db.collection('filter_presets');

    const update = { updatedAt: new Date() };
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (color !== undefined) update.color = color;
    if (criteria !== undefined) update.criteria = criteria;

    const result = await presets.updateOne(
      { _id: new ObjectId(req.params.id), userId: req.user.userId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update preset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/presets/:id', authMiddleware, async (req, res) => {
  try {
    const presets = db.collection('filter_presets');
    const result = await presets.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete preset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// CSV Export (Analyst feature)
// ============================================================

app.get('/api/export/csv', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5000, 50000);
    const flowEvents = db.collection('flow_events');

    const events = await flowEvents
      .find({})
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    // Strategy map for CSV output
    const strategyMap = {
      0: 'Custom', 1: 'Call', 2: 'Put', 3: 'Call', 4: 'Put',
      5: 'Covered Call', 6: 'Protective Put',
      7: 'Bull Call Spread', 8: 'Bear Call Spread', 9: 'Bull Put Spread', 10: 'Bear Put Spread',
      14: 'Straddle', 15: 'Strangle', 16: 'Call Butterfly', 17: 'Put Butterfly',
      18: 'Iron Butterfly', 19: 'Iron Condor',
    };

    const sentimentLabels = ['Very Bearish', 'Bearish', 'Neutral', 'Directional', 'Bullish', 'Very Bullish'];
    const sideLabels = { 1: 'Buy', 2: 'Sell' };
    const flowTypeLabels = { 0: 'Single', 1: 'Split', 2: 'Sweep', 3: 'Block' };

    // CSV header
    const headers = ['Code', 'Date', 'Symbol', 'Sentiment', 'Side', 'Strategy', 'Premium', 'Price', 'Bid', 'Ask', 'Volume', 'OI', 'OTM', 'Expiration', 'Spot', 'Strikes', 'FlowType', 'Opening', 'Chance'];
    const rows = events.map(e => [
      e._id,
      e.date ? new Date(e.date).toISOString() : '',
      e.symbol,
      sentimentLabels[e.sentiment] || e.sentiment,
      sideLabels[e.side] || e.side,
      strategyMap[e.definition] || e.definition,
      e.premium,
      e.price,
      e.bid,
      e.ask,
      e.volume,
      e.oi,
      e.otm,
      e.expiration ? new Date(e.expiration).toISOString() : '',
      e.spot,
      e.strikes ? e.strikes.join('/') : '',
      flowTypeLabels[e.type] || e.type,
      e.opening,
      e.chance,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=options-flow-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// Stats Route (for admin dashboard)
// ============================================================

app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const flowEvents = db.collection('flow_events');
    const users = db.collection('users');
    const watchlists = db.collection('watchlists');

    const [totalFlows, totalUsers, totalWatchlists, uniqueSymbols] = await Promise.all([
      flowEvents.countDocuments(),
      users.countDocuments(),
      watchlists.countDocuments(),
      flowEvents.distinct('symbol').then(s => s.length),
    ]);

    // Date range of data
    const [oldest, newest] = await Promise.all([
      flowEvents.findOne({}, { sort: { date: 1 }, projection: { date: 1 } }),
      flowEvents.findOne({}, { sort: { date: -1 }, projection: { date: 1 } }),
    ]);

    res.json({
      totalFlows,
      totalUsers,
      totalWatchlists,
      uniqueSymbols,
      dateRange: {
        from: oldest?.date,
        to: newest?.date,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// Start Server
// ============================================================

connectDB()
  .then(async () => {
    // Seed default admin account
    const users = db.collection('users');
    const existing = await users.findOne({ email: 'admin' });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await users.insertOne({
        email: 'admin',
        name: 'Administrator',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      console.log('Default admin account created (admin/admin)');
    }

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Options Flow Server running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
