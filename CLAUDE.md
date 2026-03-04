# CLAUDE.md - Options Flow Tracker (CS 4604 Course Project)

## Project Overview

This is a CS 4604 (Intro to Database Management Systems) course project at Virginia Tech.
An options flow tracking web application that displays historical options trading data
with filtering, watchlists, and sentiment analysis.

**This is adapted from a personal project. The school version uses a LOCAL, STATIC MongoDB
database (no cloud sync, no external APIs, no real-time updates).**

## Architecture

```
option_flow/
├── client/          # React frontend (CRA + Tailwind)
├── server/          # Express.js backend API
├── docs/            # Project documents (proposals, ER diagrams) - DO NOT MODIFY
└── CLAUDE.md
```

## Data Source

- **MongoDB**: `localhost:27017`, database: `option_flow_school`, collection: `flow_events`
- **~1.2 million documents** of historical options flow data
- This is a STATIC snapshot - no sync, no updates, no external data sources

### Flow Event Document Schema (MongoDB)

```javascript
{
  _id: "OxVfbKSO1CdC",        // string, unique trade code
  sentiment: 2,                 // int 0-5 (0=Very Bearish, 5=Very Bullish)
  date: ISODate("2025-09-30"),  // datetime, trade timestamp
  premium: 28290.0,             // float, dollar premium
  definition: 38,               // int, strategy ID (maps to strategy lookup)
  symbol: "BSX",                // string, ticker symbol
  type: 0,                      // int, flow type (0=Single, 1=Split, 2=Sweep, 3=Block)
  chance: 57.21936,             // float, probability percentage 0-100
  price: 4.1,                   // float, trade price
  bid: 4.1,                     // float
  ask: 4.3,                     // float
  volume: 597,                  // int64
  oi: 1438,                     // int64, open interest
  otm: false,                   // bool, out of the money
  side: 2,                      // int, 1=Buy, 2=Sell
  expiration: ISODate("..."),   // datetime
  spot: 97.36,                  // float, underlying spot price
  opening: false,               // bool, opening transaction
  expirations: [20251017],      // array of int (YYYYMMDD)
  strikes: [97.0]               // array of float
}
```

### Existing MongoDB Indexes
- `date_1`
- `symbol_1`
- `date_-1_premium_-1`

## ER Diagram Entities (from Phase 2/3)

The relational schema includes these entities. For this project, we implement
them via MongoDB collections + Express API:

| Entity | Implementation |
|--------|---------------|
| FlowEvent | MongoDB `flow_events` collection (already populated) |
| User | MongoDB `users` collection (simple auth) |
| Watchlist | MongoDB `watchlists` collection |
| Watchlist_Item | Embedded in watchlist document as `tickers` array |
| Filter_Preset | MongoDB `filter_presets` collection |
| Option_Strategy | In-memory lookup map (60+ strategies, static data) |
| Sentiment | In-memory lookup map (6 levels, static data) |
| Trade (type) | In-memory lookup map (4 types, static data) |
| Asset | In-memory lookup map (Stock/ETF/Future, static data) |

## Server Requirements

### Tech Stack
- Express.js (JavaScript, not TypeScript - keep it simple for school)
- MongoDB driver: `mongodb` (native driver, not mongoose)
- Port: 3001

### API Endpoints Needed

#### Flow Data (read from MongoDB)
- `GET /api/options?limit=N` - Get latest N flow events, sorted by date desc
- `GET /api/options-before?code=X&limit=N` - Get N events before code X (pagination)
- `GET /api/options-since?lastLatestCode=X` - Get events newer than code X
- `GET /api/check-new-data?lastLatestCode=X` - Check if new data exists (always returns false for static DB)

#### Watchlists (CRUD)
- `GET /api/watchlists` - Get all watchlists for current user
- `POST /api/watchlists` - Create watchlist
- `PUT /api/watchlists/:id` - Update watchlist (rename, reorder tickers)
- `DELETE /api/watchlists/:id` - Delete watchlist
- `POST /api/watchlists/:id/tickers` - Add ticker to watchlist
- `DELETE /api/watchlists/:id/tickers/:symbol` - Remove ticker from watchlist

#### Filter Presets (CRUD)
- `GET /api/presets` - Get all presets for current user
- `POST /api/presets` - Create preset
- `PUT /api/presets/:id` - Update preset
- `DELETE /api/presets/:id` - Delete preset

#### Auth (simple, for demo)
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user

#### Tickers metadata
- `GET /api/tickers` - Return unique symbols from flow_events with counts

### Server Notes
- Use `cors` middleware
- Static data (flow.json, tickers.json) not needed - serve from MongoDB
- The check-new-data endpoint should always return `{ hasNewData: false }` since this is a static DB
- Add proper indexes for performance

## Client Modifications

The React frontend in `client/` needs these changes:

### REMOVE (private project features)
1. **setupProxy.js** - Remove the proxy to `api.retard.icu` (replace with local backend)
2. **WebSocket / real-time updates** - Remove auto-refresh interval (15-second polling)
3. **Force Refresh button** - Remove (no data updates)
4. **OptionStrat Builder integration** - Remove `handleOpenInBuilder`, external links to optionstrat.com
5. **Image generation / share card** - Remove `handleGenerateImage`, `ShareCard` component, `html2canvas`
6. **"Fetch more data" / Load All** - Keep but simplify (just pagination)
7. **References to optionstrat.com** in click handlers

### KEEP & ADAPT
1. **Filter system** - Keep all 20+ filters, they demonstrate DB querying
2. **Watchlist** - Move from localStorage to backend API calls
3. **Filter Presets** - Move from hardcoded to backend API
4. **Sentiment Gauge** - Keep
5. **Virtual scrolling** - Keep (performance with 1.2M records)
6. **Dark theme / mobile responsive** - Keep (value-added features)
7. **Date picker** - Keep

### ADD
1. **Login/Register page** - Simple auth UI
2. **User role indicator** - Show current role in header
3. **CSV Export button** - For Analyst role (proposal requirement)

### setupProxy.js replacement
Replace with proxy to local backend:
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
  }));
};
```

## Style Guide
- Comments in English
- Variable names in English
- Dark theme colors: `#040421`, `#0a0d2e`, `#0f1435`
- Accent color: `#bedbed` (light blue)
- Use Tailwind CSS classes

## What NOT to expose
- No references to `retard.icu`, `crunch.retard.icu`, or any external API
- No cloud database connection strings
- No API keys or tokens
- No WebSocket URLs
- No references to personal projects or usernames
