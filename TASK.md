# Task: Frontend modifications for school project

## Context
- Project: E:\documents\CS_4604\option_flow
- Backend: server/index.js (Express, port 4001, MongoDB) — ALREADY DONE, DO NOT MODIFY
- Frontend: client/src/App.js — needs modifications
- Read CLAUDE.md for full project context

## Task 1: Auth UI (Login/Register)

Add a simple auth system to the frontend. The backend already has:
- POST /api/auth/register { email, password, name } → { token, user }
- POST /api/auth/login { email, password } → { token, user }
- GET /api/auth/me (with Bearer token) → { user }

### Requirements:
1. Add auth state to App.js: `const [user, setUser] = useState(null); const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));`
2. On mount, if authToken exists, call GET /api/auth/me to restore session
3. If NOT logged in, show a login/register overlay (not a separate page, just a modal/overlay)
   - Toggle between Login and Register forms
   - Style matching the dark theme (#040421 bg, #0a0d2e cards, blue-600 buttons)
   - After successful login/register: store token in localStorage, set user state, close overlay
4. If logged in, show user info in the header area (small text like "Logged in as name@email.com (trader)" and a Logout button)
5. Allow browsing data WITHOUT login (read-only). Only Watchlist/Presets/Export require auth.
6. Save token as `localStorage.setItem('authToken', token)`
7. Helper function to get auth headers: `const authHeaders = () => authToken ? { Authorization: 'Bearer ' + authToken } : {}`

## Task 2: Watchlist → Backend API

Replace localStorage-based watchlist with backend API calls. The backend has:
- GET /api/watchlists → [{ id, name, tickers }]
- POST /api/watchlists { name } → { id, name, tickers }
- PUT /api/watchlists/:id { name?, tickers? } → { success }
- DELETE /api/watchlists/:id → { success }
- POST /api/watchlists/:id/tickers { symbol } → { success }
- DELETE /api/watchlists/:id/tickers/:symbol → { success }

### Requirements:
1. Remove the 3 localStorage useEffects (load lists, save lists, save activeListId)
2. Add a useEffect that loads watchlists from API when user is logged in
3. Modify `addList()` to POST /api/watchlists and use the returned id
4. Modify `deleteList()` to DELETE /api/watchlists/:id
5. Modify `renameList()` to PUT /api/watchlists/:id with { name }
6. Modify `addToWatchlist()` to POST /api/watchlists/:id/tickers
7. Modify `removeFromWatchlist()` to DELETE /api/watchlists/:id/tickers/:symbol
8. For drag-and-drop reorder: PUT /api/watchlists/:id with the new tickers array
9. If user is NOT logged in, show a message in the Lists tab: "Log in to use watchlists"
10. All API calls should include auth headers: `{ headers: { Authorization: 'Bearer ' + authToken } }`

## Task 3: Simple Admin Panel

Add a minimal admin view that shows when user.role === 'admin'.

### Requirements:
1. When admin is logged in, add a small "Admin" tab/button in the header
2. Admin panel shows stats from GET /api/stats:
   - Total flow events count
   - Total users
   - Total watchlists
   - Unique symbols
   - Data date range
3. Keep it simple — a modal or overlay, same dark theme styling
4. Include auth headers in the stats API call

## Task 4: CSV Export fix

The handleExportCSV function currently tries to use query param for token. Fix it:
```javascript
const handleExportCSV = async () => {
  if (!authToken) {
    alert('Please log in to export data');
    return;
  }
  try {
    const response = await fetch('/api/export/csv?limit=5000', {
      headers: { Authorization: 'Bearer ' + authToken }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `options-flow-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
  }
};
```

## Style Guide
- All comments in English
- Match existing dark theme colors
- Use Tailwind CSS classes consistent with existing code
- Use lucide-react icons (already imported: X, Calendar, XCircle, Download)
  - Can add: LogIn, LogOut, User, Shield, BarChart3 from lucide-react
- Keep code in App.js (single file is fine for this project)

## Important
- Do NOT modify server/index.js
- Do NOT modify anything in docs/
- Test that the app still compiles after changes
