# Options Flow Tracker

[![Virginia-Tech CS](https://img.shields.io/badge/Virginia_Tech-CS-861F41)](https://github.com/Jerry-NotesHub/Virginia-Tech-Shields)

A full-stack web application for tracking and analyzing unusual options market activity. Built as a course project for **CS 4604 — Introduction to Database Management Systems** (Spring 2026, Virginia Tech).

## Team Members

- **Lizhou Wang**
- **Jiawei Qin**
- **Changze Li**
- **Shijun Zhao**

## Overview

Options Flow Tracker provides a real-time dashboard for monitoring large options trades ("flow") across the U.S. equity and ETF markets. Users can filter, sort, and analyze flow data to identify unusual trading activity, manage personal watchlists, save filter presets, and export data for further analysis.

### Key Features

- **Flow Dashboard** — Browse 1.2M+ historical options flow events with pagination and real-time filtering
- **Advanced Filters** — Filter by ticker symbol, premium size, expiration date, trade date range, strategy type, flow type (sweep/block/split), buy/sell side, calls/puts/spreads, and more
- **Watchlists** — Create and manage multiple ticker watchlists to quickly filter for symbols you care about
- **Filter Presets** — Save frequently used filter configurations for quick access
- **CSV Export** — Download filtered flow data as CSV for offline analysis
- **User Authentication** — Secure registration and login with JWT-based sessions
- **Admin Dashboard** — System statistics including total flow events, unique symbols, registered users, and data date range
- **Responsive Design** — Works on both desktop and mobile browsers

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Tailwind CSS, Lucide Icons |
| Backend   | Express.js 4, Node.js               |
| Database  | MongoDB 7 (local)                    |
| Auth      | JWT + bcrypt                         |

## Prerequisites

- **Node.js** v18+ (v22 recommended)
- **MongoDB** v7+ running locally on `localhost:27017`
- **npm** (comes with Node.js)

## Database Setup

The application uses a local MongoDB database named `option_flow_school` with the following collections:

| Collection      | Description                        |
|-----------------|------------------------------------|
| `flow_events`   | 1.2M+ options flow event records   |
| `users`         | Registered user accounts           |
| `watchlists`    | User-created ticker watchlists     |
| `filter_presets` | Saved filter configurations       |

### Importing Data

> **Note:** The database dump files are not included in this repository due to file size constraints. You must obtain the `data/` directory separately and place it in the project root before running `mongorestore`.

Once you have the `data/` directory:

```bash
mongorestore --db option_flow_school data/option_flow_school/
```

This will import all collections including `flow_events` (~1.2M documents), lookup tables (`sentiments`, `option_strategies`, `trades`, `assets`, `ticker_symbols`), and user data.

Alternatively, you can import just the flow events and let the server seed lookup tables on startup:

```bash
mongorestore --db option_flow_school --collection flow_events data/option_flow_school/flow_events.bson
cd server && node seed_lookup.js
```

### Creating Indexes

The server automatically creates the following indexes on startup:
- `flow_events`: compound index on `{ date: -1, premium: -1 }`
- `users`: unique index on `{ email: 1 }`
- `watchlists`: index on `{ userId: 1 }`
- `filter_presets`: index on `{ userId: 1 }`

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SeaL773/option-flow-tracker.git
cd option-flow-tracker
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd server
node index.js
```

The API server will start on `http://127.0.0.1:4001`.

On first launch, a default admin account is created automatically:
- **Email:** `admin`
- **Password:** `admin`

### Start the Frontend Dev Server

```bash
cd client
set PORT=13100        # Windows
export PORT=13100     # macOS/Linux
npx react-scripts start
```

The frontend will be available at `http://localhost:13100`.

## API Endpoints

### Authentication

| Method | Endpoint           | Description              | Auth Required |
|--------|--------------------|--------------------------|---------------|
| POST   | `/api/auth/register` | Register a new account  | No            |
| POST   | `/api/auth/login`    | Login and receive JWT   | No            |
| GET    | `/api/auth/me`       | Get current user info   | Yes           |

### Flow Events

| Method | Endpoint             | Description                          | Auth Required |
|--------|----------------------|--------------------------------------|---------------|
| GET    | `/api/options`       | Query flow events (paginated)        | No            |
| GET    | `/api/check-new-data`| Check for new data since timestamp   | No            |

#### Query Parameters for `/api/options`

- `limit` — Number of results (default: 10000)
- `before` — Cursor-based pagination (ISO date string)
- `symbols` — Comma-separated ticker symbols
- `minPremium` — Minimum premium filter
- `maxExpDays` — Maximum days to expiration
- `startDate` / `endDate` — Trade date range
- `sides` — Buy/Sell filter
- `flowTypes` — Sweep/Block/Split/Single
- `assetTypes` — Stocks/ETFs
- `optionTypes` — Calls/Puts/Spreads
- `otm` — Out-of-the-money only
- `volOi` — Volume > Open Interest
- `aboveAsk` — Traded above ask / below bid

### Watchlists

| Method | Endpoint                              | Description              | Auth Required |
|--------|---------------------------------------|--------------------------|---------------|
| GET    | `/api/watchlists`                     | Get all user watchlists  | Yes           |
| POST   | `/api/watchlists`                     | Create a new watchlist   | Yes           |
| PUT    | `/api/watchlists/:id`                 | Rename a watchlist       | Yes           |
| DELETE | `/api/watchlists/:id`                 | Delete a watchlist       | Yes           |
| POST   | `/api/watchlists/:id/tickers`         | Add ticker to watchlist  | Yes           |
| DELETE | `/api/watchlists/:id/tickers/:symbol` | Remove ticker            | Yes           |

### Filter Presets

| Method | Endpoint               | Description              | Auth Required |
|--------|------------------------|--------------------------|---------------|
| GET    | `/api/presets`         | Get all user presets     | Yes           |
| POST   | `/api/presets`         | Save a filter preset     | Yes           |
| DELETE | `/api/presets/:id`     | Delete a preset          | Yes           |

### Export & Stats

| Method | Endpoint           | Description                    | Auth Required |
|--------|--------------------|--------------------------------|---------------|
| GET    | `/api/export/csv`  | Export filtered data as CSV    | Yes           |
| GET    | `/api/stats`       | Admin dashboard statistics     | Yes (admin)   |

## Flow Event Data Schema

Each flow event document contains:

| Field        | Type     | Description                              |
|--------------|----------|------------------------------------------|
| `_id`        | String   | Unique event identifier                  |
| `symbol`     | String   | Ticker symbol (e.g., SPY, AAPL)          |
| `date`       | Number   | Unix timestamp of the trade              |
| `premium`    | Number   | Total premium in dollars                 |
| `sentiment`  | Number   | Sentiment ID (0=Bearish to 5=Neutral)    |
| `definition` | Number   | Strategy ID (maps to 60+ strategy types) |
| `type`       | Number   | Flow type (0=Single, 1=Split, 2=Sweep, 3=Block) |
| `side`       | Number   | Trade side (0=Buy, 1=Sell)               |
| `volume`     | Number   | Options volume                           |
| `oi`         | Number   | Open interest                            |
| `spot`       | Number   | Underlying stock price at time of trade  |
| `strikes`    | Array    | Strike prices involved                   |
| `expiration` | String   | Options expiration date                  |
| `bid`        | Number   | Bid price                                |
| `ask`        | Number   | Ask price                                |
| `price`      | Number   | Trade execution price                    |

## Project Structure

```
option-flow-tracker/
├── client/                  # React frontend
│   ├── public/              # Static assets (logo, icons)
│   ├── src/
│   │   ├── App.js           # Main application component
│   │   ├── App.css          # Custom styles
│   │   ├── setupProxy.js    # API proxy configuration
│   │   └── index.js         # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                  # Express.js backend
│   ├── index.js             # API server & routes
│   └── package.json
├── .gitignore
└── README.md
```

## Design

The application uses **Virginia Tech brand colors**:

- **Chicago Maroon** (`#861F41`) — Primary buttons and UI accents
- **Burnt Orange** (`#E5751F`) — Highlights, links, selection borders
- **Dark Maroon** (`#1a0a11`, `#2d1118`, `#3d1a22`) — Background layers
- **Yardline White** (`#FFFFFF`) — Text and icons

## License

This project was developed for educational purposes as part of CS 4604 at Virginia Tech.
