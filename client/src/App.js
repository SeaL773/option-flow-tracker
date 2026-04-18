import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Calendar, XCircle, Download, LogIn, LogOut, User, Shield, BarChart3, KeyRound } from 'lucide-react';
import { FixedSizeList } from 'react-window';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

/**
 * TIMEZONE POLICY:
 * All date/time displays and filters in this application use Eastern Time (ET) as the standard timezone.
 * The timezone identifier 'America/New_York' is used throughout, which automatically handles:
 * - Eastern Daylight Time (EDT, UTC-4) during daylight saving time
 * - Eastern Standard Time (EST, UTC-5) during standard time
 *
 * This ensures consistent time display regardless of the user's local timezone.
 */

// Strategy map - moved outside component to avoid recreation
const strategyMap = {
  0: 'Custom',
  1: 'Call', 2: 'Put', 3: 'Call', 4: 'Put',
  5: 'Covered Call', 6: 'Protective Put',
  7: 'Bull Call Spread', 8: 'Bear Call Spread', 9: 'Bull Put Spread', 10: 'Bear Put Spread',
  11: 'Calendar Call Spread', 12: 'Diagonal Call Spread', 13: 'Collar',
  14: 'Straddle', 15: 'Strangle',
  16: 'Call Butterfly', 17: 'Put Butterfly', 18: 'Iron Butterfly', 19: 'Iron Condor',
  20: 'Call Butterfly', 21: 'Put Butterfly',
  22: 'Bull Call Ladder', 23: 'Bear Call Ladder', 24: 'Bull Put Ladder', 25: 'Bear Put Ladder',
  26: 'Calendar Put Spread', 27: 'Diagonal Put Spread',
  28: 'Call Ratio Backspread', 29: 'Put Ratio Backspread',
  30: 'Call Condor', 31: 'Put Condor', 32: 'Call Condor', 33: 'Put Condor',
  34: 'Inverse Iron Butterfly', 35: 'Inverse Iron Condor',
  36: 'Covered Straddle', 37: 'Covered Strangle',
  38: 'Straddle', 39: 'Strangle',
  40: 'Call Broken Wing', 41: 'Put Broken Wing', 42: 'Inverse Call Broken Wing', 43: 'Inverse Put Broken Wing',
  44: 'Double Diagonal', 45: 'Strap', 46: 'Strip',
  47: 'Call Ratio Spread', 48: 'Put Ratio Spread',
  49: 'Guts', 50: 'Guts',
  51: 'Synthetic Future', 52: 'Synthetic Future', 53: 'Synthetic Put',
  54: 'Combo', 55: 'Combo',
  56: 'Jade Lizard', 57: 'Reverse Jade Lizard',
  58: 'Reverse Calendar Call', 59: 'Reverse Calendar Put',
  60: 'Reverse Diagonal Call', 61: 'Reverse Diagonal Put',
  101: 'Calls', 102: 'Puts', 103: 'Calls', 104: 'Puts',
  105: 'Stock', 106: 'Stock', 107: 'Empty', 108: 'Double Calendar'
};

// Sentiment map - moved outside component to avoid recreation
const sentimentMap = {
  0: {
    label: 'Very Bearish',
    color: 'text-red-600',
    symbolColor: '#9c0021',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4" style={{ transform: 'rotate(150deg) scale(1.3)', color: '#9c0021' }}><path fill="currentColor" d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2 160 448c0 17.7 14.3 32 32 32s32-14.3 32-32l0-306.7L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path></svg>
  },
  1: {
    label: 'Bearish',
    color: 'text-red-400',
    symbolColor: '#cc002b',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="w-4 h-4" style={{ transform: 'scale(1.35)', color: '#cc002b' }}><path fill="currentColor" d="M384 352c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0c17.7 0 32-14.3 32-32l0-160c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 82.7L342.6 137.4c-12.5-12.5-32.8-12.5-45.3 0L192 242.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0L320 205.3 466.7 352 384 352z"></path></svg>
  },
  2: {
    label: 'Neutral',
    color: 'text-gray-400',
    symbolColor: '#a2a2a2',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4" style={{ transform: 'rotate(90deg) scale(1.3)', color: '#a2a2a2' }}><path fill="currentColor" d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2 160 448c0 17.7 14.3 32 32 32s32-14.3 32-32l0-306.7L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path></svg>
  },
  3: {
    label: 'Directional',
    color: 'text-[#E5751F]',
    symbolColor: '#c800c1',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4" style={{ transform: 'scale(1.3)', color: '#c800c1' }}><path fill="currentColor" d="M403.8 34.4c12-5 25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-32-37.5 0c-8.5 0-16.6 3.4-22.6 9.4L237.3 256l86.6 86.6c6 6 14.1 9.4 22.6 9.4l37.5 0 0-32c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-32-37.5 0c-25.5 0-49.9-10.1-67.9-28.1L178.7 288 32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l146.7 0 99.9-99.9c18-18 42.4-28.1 67.9-28.1L384 96l0-32c0-12.9 7.8-24.6 19.8-29.6z"></path></svg>
  },
  4: {
    label: 'Bullish',
    color: 'text-[#E5751F]',
    symbolColor: '#00c038',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="w-4 h-4" style={{ transform: 'scale(1.35)', color: '#00c038' }}><path fill="currentColor" d="M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160 384 160z"></path></svg>
  },
  5: {
    label: 'Very Bullish',
    color: 'text-[#E5751F]',
    symbolColor: '#007823',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4" style={{ transform: 'rotate(30deg) scale(1.3)', color: '#007823' }}><path fill="currentColor" d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2 160 448c0 17.7 14.3 32 32 32s32-14.3 32-32l0-306.7L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path></svg>
  }
};

// Helper functions - moved outside component to avoid recreation
const formatPremium = (premium) => {
  if (premium >= 1000000) return `$${(premium / 1000000).toFixed(2)}m`;
  if (premium >= 1000) return `$${(premium / 1000).toFixed(0)}k`;
  return `$${premium}`;
};

const formatTime = (dateString) => {
  const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcDateString);

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  });

  const parts = formatter.formatToParts(date);
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const dayPeriod = parts.find(p => p.type === 'dayPeriod').value.toLowerCase();

  return `${month}/${day} ${hour}:${minute}${dayPeriod}`;
};

const formatExpiration = (dateString) => {
  const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcDateString);

  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric'
  });
  const year = parseInt(etFormatter.format(date));
  const currentYear = parseInt(etFormatter.format(new Date()));

  if (year !== currentYear) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      timeZone: 'America/New_York'
    });
    const parts = formatter.formatToParts(date);
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const yr = parts.find(p => p.type === 'year').value;
    return `${month} ${day} '${yr}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York'
  });
};

const getFlowType = (flow) => {
  const flowType = flow.flowType;
  switch(flowType) {
    case 3: return <span className="text-[#E5751F] font-semibold">BLOCK</span>;
    case 2: return <span className="text-orange-400 font-semibold">SWEEP</span>;
    case 1: return <span className="text-[#E5751F]">SPLIT</span>;
    case 0:
    default: return null;
  }
};

// Deduplicate flow data by code - ensures no duplicates with minimal performance overhead
const deduplicateFlows = (flows) => {
  if (!flows || flows.length === 0) return [];

  const seen = new Map();

  // Use Map for O(n) deduplication - keeps the FIRST occurrence of each code
  flows.forEach(flow => {
    if (flow.code && !seen.has(flow.code)) {
      seen.set(flow.code, flow);
    }
  });

  return Array.from(seen.values());
};

// Merge new flows with existing ones, keeping only unique codes
const mergeFlows = (existingFlows, newFlows) => {
  if (!newFlows || newFlows.length === 0) return existingFlows;
  if (!existingFlows || existingFlows.length === 0) return deduplicateFlows(newFlows);

  // Use Map for efficient lookup and deduplication
  const flowMap = new Map();

  // Add existing flows first (they have priority - keep newer data first)
  existingFlows.forEach(flow => {
    if (flow.code) {
      flowMap.set(flow.code, flow);
    }
  });

  // Add new flows (only if code doesn't exist)
  newFlows.forEach(flow => {
    if (flow.code && !flowMap.has(flow.code)) {
      flowMap.set(flow.code, flow);
    }
  });

  return Array.from(flowMap.values());
};

function App() {
  const [flowData, setFlowData] = useState([]);
  const [tickerInput, setTickerInput] = useState('');
  const [tickerSuggestions, setTickerSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('current');
  const [tickersData, setTickersData] = useState(null);
  const hasLoadedRef = React.useRef(false);
  const tableRef = useRef(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadAllProgress, setLoadAllProgress] = useState(0);
  const cancelLoadAllRef = useRef(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Auth states
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Admin panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [createUserForm, setCreateUserForm] = useState({ email: '', password: '', name: '', role: 'trader' });
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');

  // DB Health state
  const [dbHealth, setDbHealth] = useState(null);
  const [showDbHealth, setShowDbHealth] = useState(false);

  // Reports state
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [reportTab, setReportTab] = useState('topSymbols');
  const [topSymbolsData, setTopSymbolsData] = useState(null);
  const [dailyActivityData, setDailyActivityData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Auth helper
  const authHeaders = useCallback(() => authToken ? { Authorization: 'Bearer ' + authToken } : {}, [authToken]);

  // Watchlist states
  const [sidebarTab, setSidebarTab] = useState('filters'); // 'filters' or 'lists'
  const [lists, setLists] = useState([
    { id: 'default', name: 'Watch List', tickers: [] }
  ]);
  const [activeListId, setActiveListId] = useState('default');
  const [isAddTickerModalOpen, setIsAddTickerModalOpen] = useState(false);
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [isRenameListModalOpen, setIsRenameListModalOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [newTickerInput, setNewTickerInput] = useState('');
  const [newListNameInput, setNewListNameInput] = useState('');
  const [listTickerSuggestions, setListTickerSuggestions] = useState([]);
  const [listSelectedSuggestionIndex, setListSelectedSuggestionIndex] = useState(-1);
  const listMenuRef = useRef(null);
  const [draggedTickerIndex, setDraggedTickerIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Detect screen size and update view mode
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close list menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listMenuRef.current && !listMenuRef.current.contains(event.target)) {
        setIsListMenuOpen(false);
      }
    };

    if (isListMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isListMenuOpen]);

  // Preset filters
  const presetFilters = [
    {
      name: "YOLOs",
      description: "High risk, high reward trades",
      color: "#ffa442",
      criteria: {
        maxExpiration: 3,
        sentiment: { bearish: true, veryBearish: true, bullish: true, veryBullish: true },
        buySide: true,
        sellSide: false,
        maxChance: 20
      }
    },
    {
      name: "In The Know",
      description: "Someone knows something",
      color: "#40ccff",
      criteria: {
        maxExpiration: 14,
        sentiment: { bearish: true, veryBearish: true, bullish: true, veryBullish: true },
        buySide: true,
        sellSide: false,
        stocks: true,
        etfs: false,
        volumeOI: true,
        smallCap: true
      }
    },
    {
      name: "Highly Unusual",
      description: "Large trades with high volume",
      color: "#fc64e1",
      criteria: {
        minPremium: 1,
        volumeOI: true
      }
    },
    {
      name: "AI Stocks",
      description: "News on AI tech related stocks",
      color: "#60e6a5",
      criteria: {
        tickers: ["NVDA", "TSM", "AMD", "META", "AI", "GOOG"]
      }
    },
    {
      name: "Large Trades",
      description: "Example filter",
      color: "#ffc700",
      criteria: {
        minPremium: 1
      }
    }
  ];

  const [filters, setFilters] = useState({
    tickers: [],
    sentiment: {
      veryBearish: true,
      bearish: true,
      neutral: true,
      directional: true,
      bullish: true,
      veryBullish: true
    },
    buySide: true,
    sellSide: true,
    single: true,
    split: true,
    sweep: true,
    block: true,
    stocks: true,
    etfs: true,
    calls: true,
    puts: true,
    spreads: true,
    minPremium: 0,
    maxExpiration: 181,
    otm: false,
    volumeOI: false,
    earnings: false,
    aboveAskBelowBid: false,
    smallCap: false,
    priceOperator: 'less',
    priceValue: '',
    chanceOperator: 'less',
    chanceValue: '',
    dateFrom: null,
    dateTo: null,
    timeRange: null,  // '1week', '2weeks', '1month', '3months', or null for all
    showExpired: false  // Show expired options for review/replay
  });

  // sentimentMap and strategyMap now defined outside component for better performance

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        setIsInitialLoading(true);
        setLoadingProgress(10);

        // Load tickers data first (fast)
        try {
          const tickersResponse = await fetch('/tickers.json');
          if (tickersResponse.ok) {
            const tickersData = await tickersResponse.json();
            setTickersData(tickersData.tickers);
          }
        } catch (err) {
          console.warn('Could not load tickers data:', err);
        }
        setLoadingProgress(20);

        // Strategy: Try fast loading first, fall back to full load
        let flowData = null;
        let usedFastLoad = false;

        // Attempt 1: Try loading smaller batch first (1000 records)
        try {
          setLoadingProgress(30);
          console.log('Attempting fast load (1000 records)...');
          const fastResponse = await fetch('/api/options?limit=1000');

          const contentType = fastResponse.headers.get('content-type');
          if (fastResponse.ok && contentType && contentType.includes('application/json')) {
            flowData = await fastResponse.json();
            usedFastLoad = true;
            console.log('✅ Fast load successful:', flowData.history?.length || 0, 'records');
          } else {
            console.warn('Fast load failed, falling back to full load...');
          }
        } catch (err) {
          console.warn('Fast load error, trying full load:', err.message);
        }

        // Attempt 2: If fast load failed, try full load (10000 records)
        if (!usedFastLoad) {
          setLoadingProgress(40);
          console.log('Loading full dataset (10000 records)...');
          const fullResponse = await fetch('/api/options?limit=10000');

          // Check if response is JSON
          const contentType = fullResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('API returned non-JSON response. Please check API endpoint.');
          }

          if (!fullResponse.ok) {
            throw new Error(`API returned status ${fullResponse.status}`);
          }

          flowData = await fullResponse.json();
          console.log('✅ Full load successful:', flowData.history?.length || 0, 'records');
        }

        setLoadingProgress(70);

        // Set data
        if (flowData && flowData.history) {
          // Deduplicate initial data to ensure no duplicates from API
          const dedupedData = deduplicateFlows(flowData.history);
          setFlowData(dedupedData);
          setLoadingProgress(100);

          const duplicatesRemoved = flowData.history.length - dedupedData.length;
          if (duplicatesRemoved > 0) {
            console.log('🔧 Removed', duplicatesRemoved, 'duplicate(s) from initial data');
          }

          // If we used fast load, load more in background
          if (usedFastLoad && dedupedData.length >= 1000) {
            setIsInitialLoading(false);
            console.log('✅ Page ready with', dedupedData.length, 'flows! Loading more in background...');

            // Load remaining data in background using incremental approach
            setTimeout(async () => {
              try {
                // Get the last code from current data to fetch data BEFORE it
                const lastCode = dedupedData[dedupedData.length - 1]?.code;

                if (!lastCode) {
                  console.log('ℹ️ No last code found, skipping background load');
                  return;
                }

                // Use options-before to fetch data incrementally (no duplicate requests!)
                const moreResponse = await fetch(`/api/options-before?code=${lastCode}&limit=9000`);

                if (moreResponse.ok) {
                  const contentType = moreResponse.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    const moreData = await moreResponse.json();

                    if (moreData.history && moreData.history.length > 0) {
                      // Append the additional data (already deduped by API design)
                      setFlowData(prevFlows => {
                        const combined = [...prevFlows, ...moreData.history];
                        const deduped = deduplicateFlows(combined);
                        const newCount = deduped.length - prevFlows.length;

                        console.log('📦 Background load complete: +', newCount, 'new flows (', deduped.length, 'total)');
                        return deduped;
                      });
                    } else {
                      console.log('ℹ️ No additional historical data available');
                    }
                  } else {
                    console.warn('⚠️ options-before endpoint not available, you can use "Fetch more data" button');
                  }
                } else {
                  console.warn('⚠️ options-before endpoint returned', moreResponse.status);
                }
              } catch (err) {
                console.warn('⚠️ Background load failed:', err.message);
                console.log('💡 You can click "Fetch more data" to manually load more');
              }
            }, 2000);
          } else {
            // Full load completed
            setIsInitialLoading(false);
            console.log('✅ Page ready with', dedupedData.length, 'flows!');
          }
        } else {
          throw new Error('No data received from API');
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setIsInitialLoading(false);

        // Show user-friendly error
        alert(
          '⚠️ Failed to load data\n\n' +
          'Error: ' + error.message + '\n\n' +
          'Please check:\n' +
          '1. API server is running\n' +
          '2. API endpoint /api/options is accessible\n' +
          '3. Check browser console for details'
        );
      }
    };
    loadData();
  }, []);

  // Load watchlists from API when user is logged in
  useEffect(() => {
    if (!authToken || !user) return;
    fetch('/api/watchlists', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.length > 0) {
          setLists(data);
          setActiveListId(data[0].id);
        }
      })
      .catch(err => console.log('Error loading watchlists:', err));
  }, [authToken, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get current active list
  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  // List management functions (API-backed)
  const addList = async (name) => {
    if (!authToken) { setShowAuthOverlay(true); return; }
    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: name.trim() }),
      });
      const newList = await res.json();
      setLists(prev => [...prev, newList]);
      setActiveListId(newList.id);
    } catch (err) { console.error('Error creating list:', err); }
  };

  const deleteList = async (listId) => {
    if (lists.length <= 1) return;
    try {
      await fetch(`/api/watchlists/${listId}`, { method: 'DELETE', headers: authHeaders() });
      const newLists = lists.filter(l => l.id !== listId);
      setLists(newLists);
      if (activeListId === listId) setActiveListId(newLists[0].id);
    } catch (err) { console.error('Error deleting list:', err); }
  };

  const renameList = async (listId, newName) => {
    try {
      await fetch(`/api/watchlists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setLists(lists.map(l => l.id === listId ? { ...l, name: newName.trim() } : l));
    } catch (err) { console.error('Error renaming list:', err); }
  };

  // Ticker management functions (API-backed)
  const addToWatchlist = async (ticker) => {
    if (!authToken) { setShowAuthOverlay(true); return; }
    const upperTicker = ticker.toUpperCase().trim();
    if (!upperTicker || activeList.tickers.includes(upperTicker)) return;
    try {
      await fetch(`/api/watchlists/${activeListId}/tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ symbol: upperTicker }),
      });
      setLists(lists.map(l =>
        l.id === activeListId ? { ...l, tickers: [...l.tickers, upperTicker] } : l
      ));
    } catch (err) { console.error('Error adding ticker:', err); }
  };

  const removeFromWatchlist = async (ticker) => {
    try {
      await fetch(`/api/watchlists/${activeListId}/tickers/${ticker}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      setLists(lists.map(l =>
        l.id === activeListId ? { ...l, tickers: l.tickers.filter(t => t !== ticker) } : l
      ));
    } catch (err) { console.error('Error removing ticker:', err); }
  };

  const handleListTickerInputChange = (e) => {
    const value = e.target.value;
    setNewTickerInput(value);
    setListTickerSuggestions(getTickerSuggestions(value));
    setListSelectedSuggestionIndex(-1);
  };

  const handleListTickerKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setListSelectedSuggestionIndex(prev =>
        prev < listTickerSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setListSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (listSelectedSuggestionIndex >= 0 && listTickerSuggestions[listSelectedSuggestionIndex]) {
        handleAddTickerSubmit(listTickerSuggestions[listSelectedSuggestionIndex]);
      } else {
        handleAddTickerSubmit(newTickerInput);
      }
    } else if (e.key === 'Escape') {
      setListTickerSuggestions([]);
      setListSelectedSuggestionIndex(-1);
      setIsAddTickerModalOpen(false);
    }
  };

  const handleAddTickerSubmit = (ticker) => {
    const tickerValue = ticker || newTickerInput;
    if (tickerValue.trim()) {
      addToWatchlist(tickerValue);
      setNewTickerInput('');
      setListTickerSuggestions([]);
      setListSelectedSuggestionIndex(-1);
      setIsAddTickerModalOpen(false);
    }
  };

  const handleAddListSubmit = () => {
    if (newListNameInput.trim()) {
      addList(newListNameInput);
      setNewListNameInput('');
      setIsAddListModalOpen(false);
    }
  };

  const handleRenameListSubmit = () => {
    if (newListNameInput.trim()) {
      renameList(activeListId, newListNameInput);
      setNewListNameInput('');
      setIsRenameListModalOpen(false);
    }
  };

  // Handle clicking a ticker in the watchlist to filter
  const handleTickerClick = (ticker) => {
    // Set ticker as the only filter
    setFilters(prev => ({
      ...prev,
      tickers: [ticker]
    }));
    // Stay on the current tab, don't switch
  };

  // Drag and drop handlers for reordering tickers
  const handleDragStart = (e, index) => {
    setDraggedTickerIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedTickerIndex === null || draggedTickerIndex === dropIndex) {
      setDraggedTickerIndex(null);
      setDragOverIndex(null);
      return;
    }

    const currentTickers = [...activeList.tickers];
    const draggedTicker = currentTickers[draggedTickerIndex];

    // Remove from old position
    currentTickers.splice(draggedTickerIndex, 1);
    // Insert at new position
    currentTickers.splice(dropIndex, 0, draggedTicker);

    // Update the list with new order (optimistic update + API persist)
    setLists(lists.map(l =>
      l.id === activeListId
        ? { ...l, tickers: currentTickers }
        : l
    ));

    // Persist reorder to API
    if (authToken) {
      fetch(`/api/watchlists/${activeListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ tickers: currentTickers }),
      }).catch(err => console.error('Error persisting ticker reorder:', err));
    }

    setDraggedTickerIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTickerIndex(null);
    setDragOverIndex(null);
  };

  // Restore auth session on mount
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + authToken } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data.user))
        .catch(() => { setAuthToken(null); localStorage.removeItem('authToken'); });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // DB Health check - poll every 30s
  useEffect(() => {
    const checkHealth = () => {
      const start = performance.now();
      fetch('/api/health')
        .then(r => r.json())
        .then(data => {
          data.roundTripMs = Math.round(performance.now() - start);
          setDbHealth(data);
        })
        .catch(() => setDbHealth({ status: 'disconnected', error: 'Cannot reach server' }));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, name: authForm.name };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('authToken', data.token);
      setAuthToken(data.token);
      setUser(data.user);
      setShowAuthOverlay(false);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    setLists([{ id: 'default', name: 'Watch List', tickers: [] }]);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setChangePasswordError('New passwords do not match');
      return;
    }
    setChangePasswordLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ currentPassword: changePasswordForm.currentPassword, newPassword: changePasswordForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setChangePasswordSuccess('Password changed successfully');
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setCreateUserSuccess(`User "${data.user.email}" created as ${data.user.role}`);
      setCreateUserForm({ email: '', password: '', name: '', role: 'trader' });
      if (adminStats) setAdminStats(s => ({ ...s, totalUsers: (s.totalUsers || 0) + 1 }));
    } catch (err) {
      setCreateUserError(err.message);
    }
  };

  // CSV export handler
  const handleExportCSV = async () => {
    if (!authToken) { setShowAuthOverlay(true); return; }
    try {
      const res = await fetch('/api/export/csv?limit=5000', { headers: authHeaders() });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `options-flow-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Export error:', err); }
  };

  const fetchReports = async (tab) => {
    setReportsLoading(true);
    try {
      if (tab === 'topSymbols' && !topSymbolsData) {
        const res = await fetch('/api/reports/top-symbols?limit=20');
        if (res.ok) setTopSymbolsData(await res.json());
      } else if (tab === 'dailyActivity' && !dailyActivityData) {
        const res = await fetch('/api/reports/daily-activity?limit=30');
        if (res.ok) setDailyActivityData(await res.json());
      }
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const openReports = (tab = 'topSymbols') => {
    setReportTab(tab);
    setShowReportsPanel(true);
    fetchReports(tab);
  };

  const switchReportTab = (tab) => {
    setReportTab(tab);
    fetchReports(tab);
  };

  const getActiveFilters = () => {
    const active = [];

    // Premium filter (only if > 0)
    if (filters.minPremium > 0) {
      active.push(`Premium>$${filters.minPremium}K`);
    }

    // Expiration filter (only if not default 181 days)
    if (filters.maxExpiration !== 181) {
      active.push(`Exp≤${filters.maxExpiration}d`);
    }

    // Time range
    if (filters.timeRange) {
      const ranges = { '1week': 'Last 1w', '2weeks': 'Last 2w', '1month': 'Last 1m', '3months': 'Last 3m' };
      active.push(ranges[filters.timeRange]);
    }

    return active;
  };

  // Get active filters for display (only show non-default filters)

  // Load all historical data with loop
  const handleLoadAll = async () => {
    // Prevent duplicate requests
    if (isLoadingAll || flowData.length === 0) return;

    cancelLoadAllRef.current = false;
    setIsLoadingAll(true);
    setLoadAllProgress(0);

    let totalLoaded = 0;
    let hasMore = true;
    let currentLastCode = flowData[flowData.length - 1]?.code;
    let previousLastCode = null;

    try {
      while (hasMore && !cancelLoadAllRef.current) {
        if (!currentLastCode) break;

        // Check if we're stuck at the same position (no new data available)
        if (previousLastCode === currentLastCode) {
          hasMore = false;
          console.log(`Load ALL completed: Reached the end (no new data). ${totalLoaded} total flows loaded`);
          break;
        }

        const response = await fetch(`/api/options-before?code=${currentLastCode}&limit=10000`);
        const data = await response.json();

        if (data.history && data.history.length > 0) {
          // Get the last code of the newly fetched data
          const newLastCode = data.history[data.history.length - 1]?.code;
          const historyData = data.history;

          // Use a promise to get the actual new count from setState
          const actualNewCount = await new Promise(resolve => {
            setFlowData(prevData => {
              const merged = mergeFlows(prevData, historyData);
              const newCount = merged.length - prevData.length;
              resolve(newCount);
              return merged;
            });
          });

          if (actualNewCount > 0) {
            totalLoaded += actualNewCount;
            setLoadAllProgress(totalLoaded);
            console.log(`Load ALL: +${actualNewCount} new flows (${historyData.length - actualNewCount} duplicates), ${totalLoaded} total`);
          } else {
            console.log(`Load ALL: No new flows (all ${historyData.length} already loaded)`);
          }
          console.log(`Load ALL: previous: ${currentLastCode}, new: ${newLastCode}`);

          // Update codes for next iteration
          previousLastCode = currentLastCode;
          currentLastCode = newLastCode;  // Use the last code from the fetched data

          // Short delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
          console.log(`Load ALL completed: No more data returned. ${totalLoaded} total flows loaded`);
        }
      }

      if (cancelLoadAllRef.current) {
        console.log(`Load ALL cancelled after loading ${totalLoaded} flows`);
      }
    } catch (error) {
      console.log('Error loading all data:', error);
    } finally {
      setIsLoadingAll(false);
      setLoadAllProgress(0);
      cancelLoadAllRef.current = false;
    }
  };

  // Cancel loading all data
  const handleCancelLoadAll = () => {
    cancelLoadAllRef.current = true;
  };

  // Get unique tickers for suggestions
  const getTickerSuggestions = (input) => {
    if (!input) return [];
    const upperInput = input.toUpperCase();
    const uniqueTickers = [...new Set(flowData.map(f => f.symbol))];

    // Separate tickers that start with input vs contain input
    const startsWith = uniqueTickers.filter(t => t.startsWith(upperInput));
    const contains = uniqueTickers.filter(t => !t.startsWith(upperInput) && t.includes(upperInput));

    // Sort alphabetically and combine
    return [
      ...startsWith.sort(),
      ...contains.sort()
    ].slice(0, 20); // Show up to 20 suggestions
  };

  const handleTickerInputChange = (e) => {
    const value = e.target.value;
    setTickerInput(value);
    setTickerSuggestions(getTickerSuggestions(value));
    setSelectedSuggestionIndex(-1);
  };

  const addTicker = (ticker) => {
    const upperTicker = ticker.toUpperCase();
    if (upperTicker && !filters.tickers.includes(upperTicker)) {
      setFilters(prev => ({
        ...prev,
        tickers: [...prev.tickers, upperTicker]
      }));
      setTickerInput('');
      setTickerSuggestions([]);
    }
  };

  const removeTicker = (ticker) => {
    setFilters(prev => ({
      ...prev,
      tickers: prev.tickers.filter(t => t !== ticker)
    }));
  };

  const applyPresetFilter = (preset) => {
    const defaultFilters = {
      tickers: [],
      sentiment: {
        veryBearish: true,
        bearish: true,
        neutral: true,
        directional: true,
        bullish: true,
        veryBullish: true
      },
      buySide: true,
      sellSide: true,
      single: true,
      split: true,
      sweep: true,
      block: true,
      stocks: true,
      etfs: true,
      calls: true,
      puts: true,
      spreads: true,
      minPremium: 0,
      maxExpiration: 181,
      otm: false,
      volumeOI: false,
      earnings: false,
      aboveAskBelowBid: false,
      smallCap: false,
      priceOperator: 'less',
      priceValue: '',
      chanceOperator: 'less',
      chanceValue: '',
      dateFrom: null,
      dateTo: null,
      timeRange: null,
      showExpired: false
    };

    // Merge preset criteria with default filters
    const newFilters = { ...defaultFilters };

    if (preset.criteria.tickers) {
      newFilters.tickers = preset.criteria.tickers;
    }
    if (preset.criteria.maxExpiration !== undefined) {
      newFilters.maxExpiration = preset.criteria.maxExpiration;
    }
    if (preset.criteria.minPremium !== undefined) {
      newFilters.minPremium = preset.criteria.minPremium;
    }
    if (preset.criteria.sentiment) {
      newFilters.sentiment = { ...defaultFilters.sentiment, ...preset.criteria.sentiment };
    }
    if (preset.criteria.buySide !== undefined) {
      newFilters.buySide = preset.criteria.buySide;
    }
    if (preset.criteria.sellSide !== undefined) {
      newFilters.sellSide = preset.criteria.sellSide;
    }
    if (preset.criteria.stocks !== undefined) {
      newFilters.stocks = preset.criteria.stocks;
    }
    if (preset.criteria.etfs !== undefined) {
      newFilters.etfs = preset.criteria.etfs;
    }
    if (preset.criteria.volumeOI !== undefined) {
      newFilters.volumeOI = preset.criteria.volumeOI;
    }
    if (preset.criteria.smallCap !== undefined) {
      newFilters.smallCap = preset.criteria.smallCap;
    }

    setFilters(newFilters);
    setActiveTab('current');
  };

  const handleTickerKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < tickerSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && tickerSuggestions[selectedSuggestionIndex]) {
        addTicker(tickerSuggestions[selectedSuggestionIndex]);
      } else {
        addTicker(tickerInput);
      }
    } else if (e.key === 'Escape') {
      setTickerSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  // formatPremium, formatTime, and formatExpiration now defined outside component

  // Time key that updates every minute for cache invalidation
  const timeKey = useMemo(() => Math.floor(Date.now() / 60000), []);

  // Cache today's date in ET timezone (recalculated every minute)
  const todayETCache = useMemo(() => {
    const now = new Date();
    const nowETStr = now.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [nowMonth, nowDay, nowYear] = nowETStr.split('/');
    const dateString = `${nowYear}-${nowMonth.padStart(2, '0')}-${nowDay.padStart(2, '0')}`;
    const dateUTC = Date.UTC(parseInt(nowYear), parseInt(nowMonth) - 1, parseInt(nowDay));

    return { dateString, dateUTC };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeKey]);

  // Cache for expiration date conversions to avoid repeated toLocaleDateString calls
  const expirationCacheRef = useRef(new Map());

  // Convert expiration date to ET timezone (cached)
  const getExpirationInET = useCallback((expirationDateString) => {
    // Check cache first
    const cached = expirationCacheRef.current.get(expirationDateString);
    if (cached) return cached;

    // Convert to ET timezone
    const utcExpirationString = expirationDateString.endsWith('Z') ? expirationDateString : expirationDateString + 'Z';
    const expirationDate = new Date(utcExpirationString);
    const expirationETStr = expirationDate.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [expMonth, expDay, expYear] = expirationETStr.split('/');
    const expDateString = `${expYear}-${expMonth.padStart(2, '0')}-${expDay.padStart(2, '0')}`;
    const expDateUTC = Date.UTC(parseInt(expYear), parseInt(expMonth) - 1, parseInt(expDay));

    const result = { dateString: expDateString, dateUTC: expDateUTC };

    // Store in cache
    expirationCacheRef.current.set(expirationDateString, result);

    return result;
  }, []);

  // Check if an option is expired based on ET timezone
  const isExpired = useCallback((expirationDateString) => {
    const expiration = getExpirationInET(expirationDateString);
    return expiration.dateString < todayETCache.dateString;
  }, [getExpirationInET, todayETCache]);

  // Calculate days to expiration in ET timezone
  const getDaysToExpiration = useCallback((expirationDateString) => {
    const expiration = getExpirationInET(expirationDateString);
    return Math.floor((expiration.dateUTC - todayETCache.dateUTC) / (1000 * 60 * 60 * 24));
  }, [getExpirationInET, todayETCache]);

  const getFlowHighlight = (flow) => {
    const daysToExpiration = getDaysToExpiration(flow.expiration);

    // Get ticker info from tickers data
    const tickerInfo = tickersData ? tickersData[flow.symbol] : null;

    // Check if it's a future (starts with /)
    const isFuture = flow.symbol.startsWith('/');

    // Check if it's an ETF (from tickers data or future)
    const isETF = isFuture || (tickerInfo ? tickerInfo.etf === true : false);
    const isStock = !isETF;

    // Check if it's small-cap (mc = 0)
    const isSmallCap = tickerInfo ? tickerInfo.mc === 0 : false;

    const isBullishOrBearish = flow.sentiment === 0 || flow.sentiment === 1 || flow.sentiment === 4 || flow.sentiment === 5;
    const isBuySide = flow.side === 1;
    const hasVolumeOI = flow.volume > flow.oi && flow.oi > 0;

    // YOLOs: < 3 days + (bullish or bearish) + buy side only + chance < 20%
    if (daysToExpiration < 3 && isBullishOrBearish && isBuySide && flow.chance < 20) {
      return {
        type: 'yolo',
        style: {
          backgroundImage: 'linear-gradient(to right, rgba(255, 164, 66, 0.01) 0%, rgba(255, 164, 66, 0.15) 50%, rgba(255, 164, 66, 0.01) 100%)',
          borderTop: '1px solid rgb(255, 164, 66)',
          borderBottom: '1px solid rgb(255, 164, 66)'
        }
      };
    }

    // In The Know: < 14 days + (bullish or bearish) + buy side + stocks only + small cap + vol > OI
    if (daysToExpiration < 14 && isBullishOrBearish && isBuySide && isStock && isSmallCap && hasVolumeOI) {
      return {
        type: 'in-the-know',
        style: {
          backgroundImage: 'linear-gradient(to right, rgba(64, 204, 255, 0.01) 0%, rgba(64, 204, 255, 0.15) 50%, rgba(64, 204, 255, 0.01) 100%)',
          borderTop: '1px solid rgb(64, 204, 255)',
          borderBottom: '1px solid rgb(64, 204, 255)'
        }
      };
    }

    // Highly Unusual: > $1.00m + vol > OI
    if (flow.premium > 1000000 && hasVolumeOI) {
      return {
        type: 'highly-unusual',
        style: {
          backgroundImage: 'linear-gradient(to right, rgba(252, 100, 225, 0.01) 0%, rgba(252, 100, 225, 0.15) 50%, rgba(252, 100, 225, 0.01) 100%)',
          borderTop: '1px solid rgb(252, 100, 225)',
          borderBottom: '1px solid rgb(252, 100, 225)'
        }
      };
    }

    return null;
  };

  // getFlowType now defined outside component

  const toggleFilter = (category, key) => {
    if (typeof filters[category] === 'object') {
      setFilters(prev => ({
        ...prev,
        [category]: { ...prev[category], [key]: !prev[category][key] }
      }));
    } else {
      setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // Filter data function
  const getFilteredData = () => {
    // Pre-calculate date filter boundaries OUTSIDE the loop (performance optimization)
    // Using timestamp comparison instead of string comparison for 50x+ speedup
    let fromTimestamp = null;
    let toTimestamp = null;

    if (filters.dateFrom) {
      // Get start of day in ET timezone as UTC timestamp
      // ET is UTC-5 (EST) or UTC-4 (EDT), use 5 hours offset for safety
      const d = new Date(filters.dateFrom);
      fromTimestamp = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 5, 0, 0);
    }

    if (filters.dateTo) {
      // Get end of day in ET timezone as UTC timestamp
      // Add 29 hours to cover UTC-4 EDT end of day (23:59 ET = 03:59 UTC next day)
      const d = new Date(filters.dateTo);
      toTimestamp = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 29, 0, 0);
    }

    // Pre-calculate time range cutoff
    let timeRangeCutoff = null;
    if (filters.timeRange) {
      const now = new Date();
      const daysAgo = {
        '1week': 7,
        '2weeks': 14,
        '1month': 30,
        '3months': 90
      };
      timeRangeCutoff = now.getTime() - (daysAgo[filters.timeRange] * 24 * 60 * 60 * 1000);
    }

    return flowData.filter(flow => {
      // Filter out expired options (based on ET timezone) unless showExpired is enabled
      if (!filters.showExpired && flow.expiration && isExpired(flow.expiration)) {
        return false;
      }

      // Date range filter - using fast timestamp comparison
      if (fromTimestamp || toTimestamp) {
        const flowTs = new Date(flow.date).getTime();
        if (fromTimestamp && flowTs < fromTimestamp) return false;
        if (toTimestamp && flowTs > toTimestamp) return false;
      }

      // Time range filter - using pre-calculated cutoff
      if (timeRangeCutoff) {
        const flowTs = new Date(flow.date).getTime();
        if (flowTs < timeRangeCutoff) return false;
      }

      // Ticker filter
      if (filters.tickers.length > 0) {
        const matchesTicker = filters.tickers.some(ticker => flow.symbol === ticker);
        if (!matchesTicker) return false;
      }

      // Sentiment filter
      const sentimentKeys = ['veryBearish', 'bearish', 'neutral', 'directional', 'bullish', 'veryBullish'];
      const sentimentValues = [0, 1, 2, 3, 4, 5];
      const allowedSentiments = sentimentKeys
        .map((key, idx) => filters.sentiment[key] ? sentimentValues[idx] : null)
        .filter(v => v !== null);
      if (!allowedSentiments.includes(flow.sentiment)) return false;

      // Side filter
      if (!filters.buySide && flow.side === 1) return false;
      if (!filters.sellSide && flow.side === 2) return false;

      // Flow type filter: 0=Single, 1=Split, 2=Sweep, 3=Block
      const flowType = flow.flowType;

      if (!filters.single && flowType === 0) return false;
      if (!filters.split && flowType === 1) return false;
      if (!filters.sweep && flowType === 2) return false;
      if (!filters.block && flowType === 3) return false;

      // Security type filter (Stocks/ETFs)
      // Get ticker info from tickers data
      const tickerInfo = tickersData ? tickersData[flow.symbol] : null;
      const isFuture = flow.symbol.startsWith('/'); // Futures start with /
      const isETF = isFuture || (tickerInfo ? tickerInfo.etf === true : false);
      const isStock = !isETF;

      // Filter based on stocks/etfs selection
      if (filters.stocks && !filters.etfs) {
        // Only stocks selected - filter out ETFs and futures
        if (isETF) return false;
      } else if (!filters.stocks && filters.etfs) {
        // Only ETFs selected - filter out stocks
        if (isStock) return false;
      } else if (!filters.stocks && !filters.etfs) {
        // Both filters off - show nothing
        return false;
      }
      // If both are true, show everything - no filtering needed

      // Option type filter based on definition
      // Note: Futures (symbol starts with /) should not be filtered by calls/puts/spreads
      // Call-based: 1(Long Call), 3(Short Call), 5(Covered Call), 101(Long Calls), 103(Short Calls)
      // Put-based: 2(Long Put), 4(Short Put), 6(Protective Put), 102(Long Puts), 104(Short Puts)
      // Spreads: 7-61 (all spread strategies)
      if (!isFuture) {
        const callDefinitions = [1, 3, 5, 101, 103];
        const putDefinitions = [2, 4, 6, 102, 104];
        const isCall = callDefinitions.includes(flow.definition);
        const isPut = putDefinitions.includes(flow.definition);
        const isSpread = flow.definition >= 7 && flow.definition <= 61;

        if (!filters.calls && isCall) return false;
        if (!filters.puts && isPut) return false;
        if (!filters.spreads && isSpread) return false;
      }

      // Premium filter (in millions)
      if (filters.minPremium > 0 && flow.premium < filters.minPremium * 1000000) return false;

      // Expiration filter (in days)
      // If maxExpiration is 181 or greater, show all expirations
      if (filters.maxExpiration < 181) {
        const daysToExpiration = getDaysToExpiration(flow.expiration);
        if (daysToExpiration > filters.maxExpiration) return false;
      }

      // Advanced filters
      if (filters.otm && !flow.otm) return false;
      if (filters.volumeOI && flow.volume <= flow.oi) return false;

      // Upcoming earnings filter
      if (filters.earnings) {
        const tickerInfo = tickersData ? tickersData[flow.symbol] : null;
        const hasUpcomingEarnings = tickerInfo && tickerInfo.er !== null;
        if (!hasUpcomingEarnings) return false;
      }

      // Above ask or below bid filter
      if (filters.aboveAskBelowBid) {
        const isAboveAsk = flow.price > flow.ask;
        const isBelowBid = flow.price < flow.bid;
        if (!isAboveAsk && !isBelowBid) return false;
      }

      // Small cap filter
      if (filters.smallCap) {
        const tickerInfo = tickersData ? tickersData[flow.symbol] : null;
        const isSmallCap = tickerInfo ? tickerInfo.mc === 0 : false;
        if (!isSmallCap) return false;
      }

      // Price filter
      if (filters.priceValue && filters.priceValue !== '') {
        const priceValue = parseFloat(filters.priceValue);
        if (!isNaN(priceValue)) {
          if (filters.priceOperator === 'less') {
            if (flow.price >= priceValue) return false;
          } else if (filters.priceOperator === 'greater') {
            if (flow.price <= priceValue) return false;
          }
        }
      }

      // Chance filter
      if (filters.chanceValue && filters.chanceValue !== '') {
        const chanceValue = parseFloat(filters.chanceValue);
        if (!isNaN(chanceValue)) {
          if (filters.chanceOperator === 'less') {
            if (flow.chance >= chanceValue) return false;
          } else if (filters.chanceOperator === 'greater') {
            if (flow.chance <= chanceValue) return false;
          }
        }
      }

      return true;
    });
  };

  // Cache filtered data - only recalculate when dependencies change
  const filteredData = useMemo(() => {
    return getFilteredData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowData, filters, tickersData]);

  // Cache sentiment calculation - only recalculate when filteredData changes
  const sentimentValue = useMemo(() => {
    const activeFlows = filteredData.filter(flow => {
      if (filters.showExpired) return true;  // Include all flows when showing expired
      if (!flow.expiration) return true;
      return !isExpired(flow.expiration);
    });

    if (activeFlows.length === 0) return 0.5; // Default to neutral

    let weightedSum = 0;
    let totalWeight = 0;

    activeFlows.forEach(flow => {
      // Normalize sentiment from 0-5 to 0-1
      const normalizedSentiment = flow.sentiment / 5;
      const weight = flow.premium || 1;

      weightedSum += normalizedSentiment * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }, [filteredData, isExpired, filters.showExpired]);

  // Handle row selection with right-click (manual multi-select)
  const handleRowClick = useCallback((e, flowCode) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle selection: if already selected, deselect; otherwise add to selection
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(flowCode)) {
        newSet.delete(flowCode);
      } else {
        newSet.add(flowCode);
      }
      return newSet;
    });
  }, []);





  // Use selected sentiment if rows are selected, otherwise use all data
  // Cache to avoid recalculating on every render
  const displaySentimentValue = useMemo(() => {
    if (selectedRows.size === 0) return sentimentValue;

    const selectedFlows = filteredData.filter(flow => {
      if (!selectedRows.has(flow.code)) return false;
      if (filters.showExpired) return true;  // Include all flows when showing expired
      if (!flow.expiration) return true;
      return !isExpired(flow.expiration);
    });

    if (selectedFlows.length === 0) return 0.5; // Default to neutral

    let weightedSum = 0;
    let totalWeight = 0;

    selectedFlows.forEach(flow => {
      // Normalize sentiment from 0-5 to 0-1
      const normalizedSentiment = flow.sentiment / 5;
      const weight = flow.premium || 1;

      weightedSum += normalizedSentiment * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }, [selectedRows, sentimentValue, filteredData, isExpired, filters.showExpired]);

  // Desktop Row Component for virtual scrolling
  const DesktopRow = ({ index, style }) => {
    // 最后一项显示按钮
    if (index === filteredData.length) {
      return (
        <div style={style} className="text-center py-6 border-t border-gray-800">
          {isLoadingAll ? (
            <>
              <button
                onClick={handleCancelLoadAll}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors"
              >
                Cancel Loading
              </button>
              <div className="mt-3 text-[#E5751F] text-sm">
                Loading... {loadAllProgress.toLocaleString()} rows loaded
              </div>
            </>
          ) : (
            <button
              onClick={handleLoadAll}
              className="bg-[#861F41] hover:bg-[#6b1835] text-white px-6 py-2 rounded font-semibold transition-colors"
            >
              Fetch more data
            </button>
          )}
        </div>
      );
    }

    const flow = filteredData[index];
    const sentimentColor = sentimentMap[flow.sentiment]?.symbolColor || '#a2a2a2';
    const highlight = getFlowHighlight(flow);
    const isSelected = selectedRows.has(flow.code);

    // Check if next row is also selected (for removing border between consecutive selections)
    const isNextSelected = index < filteredData.length - 1 && selectedRows.has(filteredData[index + 1]?.code);
    const isPrevSelected = index > 0 && selectedRows.has(filteredData[index - 1]?.code);

    return (
      <div style={style}>
        <div
          onContextMenu={(e) => handleRowClick(e, flow.code)}
          style={{
            ...(isSelected ? {
              borderLeft: '2px solid #E5751F',
              borderRight: '2px solid #E5751F',
              borderTop: isPrevSelected ? 'none' : '2px solid #E5751F',
              borderBottom: isNextSelected ? 'none' : '2px solid #E5751F',
              // Use padding and negative margin to overlap and hide borders
              ...(isPrevSelected ? {
                marginTop: '-4px',
                paddingTop: '4px'
              } : {}),
              position: 'relative',
              // Higher z-index for later rows so they cover earlier rows
              zIndex: 10 + index,
              // Add a subtle background to prevent border color bleeding
              backgroundColor: '#2d1118',
              // Ensure background extends fully
              boxSizing: 'border-box'
            } : {})
          }}
        >
          <table className="w-full hover:bg-[#3d1a22] cursor-pointer transition-colors" style={{
            tableLayout: 'fixed',
            minWidth: '700px',
            borderBottom: isSelected ? 'none' : '1px solid #1f2937',
            ...(highlight ? highlight.style : {})
          }}>
          <tbody>
            <tr style={{ height: '36px', lineHeight: '1.2em' }}>
              <td className="text-sm text-gray-400" style={{ width: '70px', padding: '0.2em 1em', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatTime(flow.date)}</td>
              <td style={{ width: '70px', padding: '0.2em 1em', verticalAlign: 'middle' }}>
                <span className="font-semibold text-sm" style={{ color: sentimentColor }}>
                  {flow.symbol}
                </span>
              </td>
              <td style={{ width: '220px', padding: '0.2em 1em', verticalAlign: 'middle' }}>
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">
                    {flow.side === 1 ? 'Buy' : 'Sell'}
                  </span>
                  <span className="text-white text-sm">
                    {flow.strike_price || ''} {strategyMap[flow.definition] || 'Unknown'}
                  </span>
                  {flow.opening && (
                    <span className="text-sm" style={{ color: '#8e9baf' }}>
                      To Open
                    </span>
                  )}
                </div>
              </td>
              <td className="text-sm text-gray-300" style={{ width: '100px', padding: '0.2em 1em', verticalAlign: 'middle' }}>{formatExpiration(flow.expiration)}</td>
              <td className="text-left" style={{ width: '90px', padding: '0.2em 0.1em 0.2em 1em', verticalAlign: 'middle' }}>
                <span className="font-semibold text-sm" style={{ color: sentimentColor }}>
                  {formatPremium(flow.premium)}
                  {flow.price > flow.ask && (
                    <sup className="text-[75%] opacity-75 relative top-[-0.5em] ml-0.5 uppercase">AA</sup>
                  )}
                  {flow.price < flow.bid && (
                    <sup className="text-[75%] opacity-75 relative top-[-0.5em] ml-0.5 uppercase">BB</sup>
                  )}
                </span>
              </td>
              <td className="text-right text-sm text-gray-300" style={{ width: '80px', padding: '0.2em 0.5em 0.2em 0.1em', verticalAlign: 'middle' }}>
                {flow.volume ? flow.volume.toLocaleString() : '-'}
              </td>
              <td className="text-right text-sm text-gray-300" style={{ width: '80px', padding: '0.2em 0.5em 0.2em 0.1em', verticalAlign: 'middle' }}>
                {flow.oi ? flow.oi.toLocaleString() : '-'}
              </td>
              <td className="text-right text-sm text-gray-300" style={{ width: '70px', padding: '0.2em 0.3em 0.2em 0.5em', verticalAlign: 'middle' }}>
                {flow.volume && flow.oi ? (flow.volume / flow.oi).toFixed(2) : '-'}
              </td>
              <td className="text-left text-sm" style={{ width: '70px', padding: '0.2em 1em 0.2em 2.5em', verticalAlign: 'middle' }}>{getFlowType(flow)}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  // Mobile Row Component for virtual scrolling
  const MobileRow = ({ index, style }) => {
    // 最后一项显示按钮
    if (index === filteredData.length) {
      return (
        <div style={style} className="text-center py-6 border-t border-gray-800">
          {isLoadingAll ? (
            <>
              <button
                onClick={handleCancelLoadAll}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors"
              >
                Cancel Loading
              </button>
              <div className="mt-3 text-[#E5751F] text-sm">
                Loading... {loadAllProgress.toLocaleString()} rows loaded
              </div>
            </>
          ) : (
            <button
              onClick={handleLoadAll}
              className="bg-[#861F41] hover:bg-[#6b1835] text-white px-6 py-2 rounded font-semibold transition-colors"
            >
              Fetch more data
            </button>
          )}
        </div>
      );
    }

    const flow = filteredData[index];
    const sentimentColor = sentimentMap[flow.sentiment]?.symbolColor || '#a2a2a2';
    const highlight = getFlowHighlight(flow);
    const isSelected = selectedRows.has(flow.code);

    // Check if next row is also selected (for removing border between consecutive selections)
    const isNextSelected = index < filteredData.length - 1 && selectedRows.has(filteredData[index + 1]?.code);
    const isPrevSelected = index > 0 && selectedRows.has(filteredData[index - 1]?.code);

    return (
      <div style={style}>
        <div
          style={{
            ...(isSelected ? {
              border: '2px solid #E5751F',
              borderTop: isPrevSelected ? 'none' : '2px solid #E5751F',
              borderBottom: isNextSelected ? 'none' : '2px solid #E5751F',
              // Use negative margin to overlap borders
              ...(isPrevSelected ? {
                marginTop: '-1px'
              } : {}),
              ...(isNextSelected ? {
                marginBottom: '-1px'
              } : {}),
              position: 'relative',
              // Higher z-index for later rows so they cover earlier rows
              zIndex: 10 + index,
              // Add a subtle background to prevent border color bleeding
              backgroundColor: '#2d1118',
              // Ensure background extends fully
              boxSizing: 'border-box'
            } : {}),
            ...(highlight ? highlight.style : {}),
            ...(!isSelected ? { borderBottom: '1px solid #1f2937' } : {}),
            cursor: 'pointer',
            lineHeight: '1.35em'
          }}
          onContextMenu={(e) => handleRowClick(e, flow.code)}
          className={`p-3 hover:bg-[#3d1a22] transition-colors`}
        >
        {isMobileView ? (
          // Extra small screens: 3-column layout
          // Ticker | Vol | Premium
          // Strategy | OI | Type
          // Exp | Vol/OI | Time
          <>
            <div className="grid grid-cols-3 gap-2 mb-2 items-center">
              <div>
                <span className="font-bold" style={{ color: sentimentColor, fontSize: '1.55em' }}>
                  {flow.symbol}
                </span>
              </div>
              <div className="text-center text-gray-300" style={{ fontSize: '0.875rem' }}>
                {flow.volume ? flow.volume.toLocaleString() : '-'}
              </div>
              <div className="text-right">
                <span className="font-bold" style={{ color: sentimentColor, fontSize: '1.55em' }}>
                  {formatPremium(flow.premium)}
                  {flow.price > flow.ask && (
                    <sup className="text-[75%] opacity-75 relative top-[-0.5em] ml-0.5 uppercase">AA</sup>
                  )}
                  {flow.price < flow.bid && (
                    <sup className="text-[75%] opacity-75 relative top-[-0.5em] ml-0.5 uppercase">BB</sup>
                  )}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2 items-center">
              <div className="text-white font-bold" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span>{flow.side === 1 ? 'Buy' : 'Sell'} </span>
                <span>
                  {flow.strike_price || ''} {strategyMap[flow.definition] || 'Unknown'}
                </span>
                {flow.opening && (
                  <span style={{ color: '#8e9baf' }}> To Open</span>
                )}
              </div>
              <div className="text-center text-gray-300" style={{ fontSize: '0.875rem' }}>
                {flow.oi ? flow.oi.toLocaleString() : '-'}
              </div>
              <div className="text-right text-sm">
                {getFlowType(flow)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2" style={{ fontSize: '0.9em', opacity: 0.75 }}>
              <div className="text-gray-300">{formatExpiration(flow.expiration)}</div>
              <div className="text-center text-gray-300">
                {flow.volume && flow.oi ? (flow.volume / flow.oi).toFixed(2) : '-'}
              </div>
              <div className="text-right text-gray-400">{formatTime(flow.date)}</div>
            </div>
          </>
        ) : (
          // Tablet size: 3-column layout
          <>
            <div className="grid grid-cols-3 gap-2 mb-2 text-xs items-start">
              <div className="text-gray-400 whitespace-nowrap">
                {formatTime(flow.date)}
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm" style={{ color: sentimentColor }}>
                  {flow.symbol}
                </span>
              </div>
              <div className="text-right">
                <div className="flex flex-wrap items-start justify-end gap-1">
                  <span className="text-white">
                    {flow.side === 1 ? 'Buy' : 'Sell'}
                  </span>
                  <span className="text-white break-words">
                    {flow.strike_price || ''} {strategyMap[flow.definition] || 'Unknown'}
                  </span>
                  {flow.opening && (
                    <span style={{ color: '#8e9baf' }}>
                      To Open
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs items-center">
              <div className="text-gray-300">
                {formatExpiration(flow.expiration)}
              </div>
              <div className="text-center">
                <span className="font-semibold" style={{ color: sentimentColor }}>
                  {formatPremium(flow.premium)}
                  {flow.price > flow.ask && (
                    <sup className="text-[75%] opacity-75 relative top-[-0.5em] ml-0.5 uppercase">AA</sup>
                  )}
                  {flow.price < flow.bid && (
                    <sup className="text-[75%] opacity-75 relative top-[-0.5em] ml-0.5 uppercase">BB</sup>
                  )}
                </span>
              </div>
              <div className="text-center text-gray-300">
                {flow.volume ? flow.volume.toLocaleString() : '-'}
              </div>
              <div className="text-center text-gray-300">
                {flow.oi ? flow.oi.toLocaleString() : '-'}
              </div>
              <div className="text-right">{getFlowType(flow)}</div>
            </div>
          </>
        )}
        </div>
      </div>
    );
  };

  // Sentiment Gauge Component
  const SentimentGauge = ({ value }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const dashArray = circumference / 2;
    const dashOffset = dashArray * (1 - value);

    // Generate unique ID for this gradient instance
    const gradientId = `sentimentGradient-${Math.random().toString(36).substr(2, 9)}`;

    // Determine gradient colors based on sentiment
    let gradientStart, gradientEnd;
    if (value < 0.4) {
      // Bearish: red gradient
      gradientStart = '#ff5252';
      gradientEnd = '#ff8a80';
    } else if (value > 0.6) {
      // Bullish: green gradient
      gradientStart = '#c7f10a';
      gradientEnd = '#efd700';
    } else {
      // Neutral: yellow/orange gradient
      gradientStart = '#efd700';
      gradientEnd = '#ffa726';
    }

    return (
      <div className="flex items-center space-x-2">
        <svg height="28.5" width="50">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={gradientStart} stopOpacity="1"></stop>
              <stop offset="1" stopColor={gradientEnd} stopOpacity="1"></stop>
            </linearGradient>
          </defs>
          <circle
            cx="25"
            cy="25"
            fill="transparent"
            r={radius}
            stroke="#374151"
            strokeDasharray={dashArray}
            strokeWidth="7"
            transform="rotate(180, 25, 25)"
          />
          <circle
            cx="25"
            cy="25"
            fill="transparent"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeWidth="7"
            transform="rotate(180, 25, 25)"
          />
        </svg>
        <div className="relative">
          <span
            className="text-xs text-gray-400"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {value < 0.4 ? 'Bearish' : value > 0.6 ? 'Bullish' : 'Neutral'} ({Math.round(value * 100)})
          </span>
          {showTooltip && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 border border-gray-700">
              {(value * 100).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Allow browsing data without login (read-only). Auth overlay handles login when needed.

  return (
    <div className="min-h-screen bg-[#1a0a11] text-gray-100">
      {/* Loading Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-[#1a0a11] z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            {/* Logo */}
            <img src="/vt-logo.svg" alt="Virginia Tech" className="w-40 animate-pulse" />

            {/* Loading Text */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Loading Options Flow</h2>
              <p className="text-gray-400 text-sm">Fetching latest options data...</p>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#861F41] to-[#E5751F] transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            {/* Progress Text */}
            <p className="text-gray-500 text-xs">{loadingProgress}%</p>

            {/* Spinner */}
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-[#E5751F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-[#861F41] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-[#E5751F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-[#2d1118] border-b border-gray-800 py-3 md:py-4">
        {/* Mobile header */}
        <div className="xl:hidden px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
            <div className="flex items-center gap-2">
              <img src="/vt-icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9" />
              <h1 className="text-lg md:text-xl font-bold" style={{ color: '#E5751F' }}>
                OptionFlow
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
              <SentimentGauge value={displaySentimentValue} />
              <div className="flex items-center gap-2">
                {selectedRows.size > 0 && (
                  <button
                    onClick={() => setSelectedRows(new Set())}
                    className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs md:text-base justify-center"
                    title={`Clear ${selectedRows.size} selection(s)`}
                  >
                    <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Clear ({selectedRows.size})</span>
                    <span className="sm:hidden">({selectedRows.size})</span>
                  </button>
                )}
                <button
                  onClick={() => openReports()}
                  className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-[#861F41] hover:bg-[#6b1835] rounded-lg transition-colors text-xs md:text-base justify-center"
                  title="View Reports"
                >
                  <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Reports</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-[#861F41] hover:bg-[#6b1835] rounded-lg transition-colors text-xs md:text-base justify-center"
                  title="Export filtered data to CSV"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop header - aligned with content below */}
        <div className="hidden xl:flex items-center">
          <div className="flex-1 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/vt-icon.png" alt="Logo" className="w-9 h-9" />
              <h1 className="text-lg md:text-xl font-bold" style={{ color: '#E5751F' }}>
                Option Flow
              </h1>
              <SentimentGauge value={displaySentimentValue} />

              {/* DB Connection Status */}
              <div className="relative">
                <button
                  onClick={() => setShowDbHealth(!showDbHealth)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors hover:bg-[#3d1a22]"
                  title="Database Connection Status"
                >
                  <span className={`w-2 h-2 rounded-full ${dbHealth?.status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-gray-400">
                    {dbHealth?.status === 'connected' ? `MongoDB · ${dbHealth.latencyMs}ms` : 'Disconnected'}
                  </span>
                </button>
                {showDbHealth && dbHealth && (
                  <div className="absolute top-full left-0 mt-1 bg-[#2d1118] border border-gray-700 rounded-lg shadow-xl p-4 z-50 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">Database Connection</span>
                      <button onClick={() => setShowDbHealth(false)} className="text-gray-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className={dbHealth.status === 'connected' ? 'text-green-400' : 'text-red-400'}>
                          {dbHealth.status === 'connected' ? '● Connected' : '● Disconnected'}
                        </span>
                      </div>
                      {dbHealth.status === 'connected' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">DBMS</span>
                            <span className="text-white">MongoDB 7</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Database</span>
                            <span className="text-white">{dbHealth.database}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Host</span>
                            <span className="text-white">localhost:27017</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">DB Ping</span>
                            <span className="text-[#E5751F] font-mono">{dbHealth.latencyMs}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Round Trip</span>
                            <span className="text-[#E5751F] font-mono">{dbHealth.roundTripMs}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Collections</span>
                            <span className="text-white">{dbHealth.collections}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Flow Events</span>
                            <span className="text-white">{dbHealth.flowEvents?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Server Uptime</span>
                            <span className="text-white">{Math.floor(dbHealth.serverUptime / 60)}m {dbHealth.serverUptime % 60}s</span>
                          </div>
                        </>
                      )}
                      {dbHealth.error && (
                        <div className="text-red-400 mt-1">{dbHealth.error}</div>
                      )}
                      <div className="text-gray-600 text-[10px] mt-2 pt-2 border-t border-gray-800">
                        Auto-refreshes every 30s · Last: {new Date(dbHealth.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
            {selectedRows.size > 0 && (
              <button
                onClick={() => setSelectedRows(new Set())}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm transition-colors"
                title={`Clear ${selectedRows.size} selection(s)`}
              >
                <XCircle className="w-4 h-4" />
                <span>Clear ({selectedRows.size})</span>
              </button>
            )}
          </div>
          <div className="px-6 flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openReports()}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#861F41] hover:bg-[#6b1835] rounded font-semibold text-sm transition-colors"
              title="View Reports"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#861F41] hover:bg-[#6b1835] rounded font-semibold text-sm transition-colors whitespace-nowrap"
              title="Export filtered data to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {user && user.role === 'admin' && (
              <button onClick={() => { setShowAdminPanel(true); fetch('/api/stats', { headers: authHeaders() }).then(r => r.json()).then(setAdminStats).catch(() => {}); }}
                className="flex items-center gap-1 px-3 py-2.5 bg-[#861F41] hover:bg-[#6b1835] rounded font-semibold text-sm transition-colors"
                title="Admin Panel">
                <Shield className="w-4 h-4" />
              </button>
            )}
            {user ? (
              <>
              <button onClick={() => { setShowChangePassword(true); setChangePasswordError(''); setChangePasswordSuccess(''); setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="flex items-center gap-1 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                title="Change Password">
                <KeyRound className="w-4 h-4" />
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                title={`Logged in as ${user.email} (${user.role})`}>
                <LogOut className="w-4 h-4" />
              </button>
              </>
            ) : (
              <button onClick={() => setShowAuthOverlay(true)}
                className="flex items-center gap-1 px-3 py-2.5 bg-[#861F41] hover:bg-[#6b1835] rounded font-semibold text-sm transition-colors">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row">
        <div className="flex-1 p-3 md:p-6 pb-20 xl:pb-6">
          <div ref={tableRef} className="bg-[#2d1118] rounded-lg overflow-hidden border border-gray-800" style={{ height: 'calc(100vh - 120px)' }}>
            {/* Desktop Table View with Virtual Scrolling */}
            <div className="hidden lg:block h-full">
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '700px' }}>
                <thead className="bg-[#3d1a22] border-b border-gray-800">
                  <tr style={{ height: '36px', lineHeight: '1.2em' }}>
                    <th className="text-left text-sm font-semibold text-gray-400" style={{ width: '70px', padding: '0.2em 1em', verticalAlign: 'middle' }}>Time</th>
                    <th className="text-left text-sm font-semibold text-gray-400" style={{ width: '70px', padding: '0.2em 1em', verticalAlign: 'middle' }}>Symbol</th>
                    <th className="text-left text-sm font-semibold text-gray-400" style={{ width: '220px', padding: '0.2em 1em', verticalAlign: 'middle' }}>Strategy</th>
                    <th className="text-left text-sm font-semibold text-gray-400" style={{ width: '100px', padding: '0.2em 1em', verticalAlign: 'middle' }}>Expiration</th>
                    <th className="text-left text-sm font-semibold text-gray-400" style={{ width: '90px', padding: '0.2em 0.1em 0.2em 1em', verticalAlign: 'middle' }}>Premium</th>
                    <th className="text-right text-sm font-semibold text-gray-400" style={{ width: '80px', padding: '0.2em 0.5em 0.2em 0.1em', verticalAlign: 'middle' }}>Volume</th>
                    <th className="text-right text-sm font-semibold text-gray-400" style={{ width: '80px', padding: '0.2em 1.75em 0.2em 0.1em', verticalAlign: 'middle' }}>OI</th>
                    <th className="text-right text-sm font-semibold text-gray-400" style={{ width: '70px', padding: '0.2em 0.3em 0.2em 0.5em', verticalAlign: 'middle' }}>Vol/OI</th>
                    <th className="text-left text-sm font-semibold text-gray-400" style={{ width: '70px', padding: '0.2em 1em 0.2em 2.5em', verticalAlign: 'middle' }}>Type</th>
                  </tr>
                </thead>
              </table>

              {/* Virtual Scrolling List */}
              <FixedSizeList
                height={window.innerHeight - 204}
                itemCount={filteredData.length + 1}
                itemSize={36}
                width="100%"
                style={{ minWidth: '700px' }}
              >
                {DesktopRow}
              </FixedSizeList>
            </div>

            {/* Mobile/Tablet Card View with Virtual Scrolling */}
            <div className="lg:hidden overflow-y-auto" style={{ maxHeight: '80vh' }}>
              <FixedSizeList
                height={window.innerHeight * 0.8}
                itemCount={filteredData.length + 1}
                itemSize={isMobileView ? 110 : 80}
                width="100%"
              >
                {MobileRow}
              </FixedSizeList>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop */}
        <div className="hidden xl:block w-96 p-6">
          <div className="bg-[#2d1118] border border-gray-800 rounded-lg overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Top-level tabs: Filters / Lists - Apple Style Segmented Control */}
          <div className="p-4 border-b border-gray-800">
            <div className="bg-[#3d1a22] p-1 rounded-lg inline-flex w-full">
              <button
                onClick={() => setSidebarTab('filters')}
                className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  sidebarTab === 'filters'
                    ? 'bg-[#861F41] text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Filters
              </button>
              <button
                onClick={() => setSidebarTab('lists')}
                className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  sidebarTab === 'lists'
                    ? 'bg-[#861F41] text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Lists
              </button>
            </div>
          </div>

          <div className="p-6">

          {sidebarTab === 'filters' ? (
            <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-2.5 rounded font-semibold text-sm transition-colors text-center ${
                activeTab === 'current'
                  ? 'bg-[#861F41] text-white'
                  : 'bg-transparent border border-gray-700 text-gray-300'
              }`}
            >
              Current Filter
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-2.5 rounded font-semibold text-sm transition-colors text-center ${
                activeTab === 'saved'
                  ? 'bg-[#861F41] text-white'
                  : 'bg-transparent border border-gray-700 text-gray-300'
              }`}
            >
              Your Filters
            </button>
          </div>

          {activeTab === 'saved' ? (
            <div className="space-y-3">
              {presetFilters.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPresetFilter(preset)}
                  className="w-full bg-[#3d1a22] border border-gray-700 hover:border-gray-600 rounded p-3 text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: preset.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-200 group-hover:text-white">
                        {preset.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-normal mb-2 text-gray-300">Tickers:</label>

              {/* Selected tickers */}
              {filters.tickers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {filters.tickers.map(ticker => (
                    <span
                      key={ticker}
                      onClick={() => removeTicker(ticker)}
                      className="inline-flex items-center gap-1 bg-[#861F41] hover:bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all group"
                    >
                      <span className="group-hover:line-through">{ticker}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTicker(ticker);
                        }}
                        className="hover:text-red-300 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input with suggestions */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a ticker"
                  className="w-full bg-[#3d1a22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#E5751F] placeholder:text-gray-500"
                  value={tickerInput}
                  onChange={handleTickerInputChange}
                  onKeyDown={handleTickerKeyDown}
                />

                {/* Suggestions dropdown */}
                {tickerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#3d1a22] border border-gray-700 rounded max-h-40 overflow-y-auto shadow-lg">
                    {tickerSuggestions.map((ticker, index) => (
                      <button
                        key={ticker}
                        onClick={() => addTicker(ticker)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-[#861F41] text-white'
                            : 'hover:bg-[#861F41]/50'
                        }`}
                      >
                        {ticker}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-normal mb-2 text-gray-300">
                Minimum premium: <span className="font-bold text-white">
                  {filters.minPremium > 0 ? `$${filters.minPremium}m` : 'All premiums'}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={filters.minPremium}
                onChange={(e) => setFilters({...filters, minPremium: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-[#E5751F]"
              />
            </div>

            <div>
              <label className="block text-xs font-normal mb-2 text-gray-300">
                Expiration: <span className="font-bold text-white">
                  {filters.maxExpiration >= 181 ? 'All expirations' : `${filters.maxExpiration} days`}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="181"
                value={filters.maxExpiration}
                onChange={(e) => setFilters({...filters, maxExpiration: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-[#E5751F]"
              />
            </div>

            <div>
              <label className="block text-xs font-normal mb-2 text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Trade Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">From</label>
                  <DatePicker
                    selected={filters.dateFrom}
                    onChange={(date) => setFilters({...filters, dateFrom: date})}
                    selectsStart
                    startDate={filters.dateFrom}
                    endDate={filters.dateTo}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start"
                    isClearable
                    popperPlacement="bottom"
                    className="w-full bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F] text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">To</label>
                  <DatePicker
                    selected={filters.dateTo}
                    onChange={(date) => setFilters({...filters, dateTo: date})}
                    selectsEnd
                    startDate={filters.dateFrom}
                    endDate={filters.dateTo}
                    minDate={filters.dateFrom}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end"
                    isClearable
                    popperPlacement="bottom"
                    className="w-full bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F] text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[
                { key: 'veryBearish', sentiment: 0 },
                { key: 'bearish', sentiment: 1 },
                { key: 'neutral', sentiment: 2 },
                { key: 'directional', sentiment: 3 },
                { key: 'bullish', sentiment: 4 },
                { key: 'veryBullish', sentiment: 5 }
              ].map(({ key, sentiment }) => (
                <button
                  key={key}
                  onClick={() => toggleFilter('sentiment', key)}
                  className={`py-2.5 px-1 rounded border transition-all relative ${
                    filters.sentiment[key]
                      ? 'bg-[#861F41]/20 border-[#861F41]'
                      : 'bg-gray-800/40 border-gray-700'
                  }`}
                  title={sentimentMap[sentiment].label}
                >
                  {filters.sentiment[key] && (
                    <span className="absolute top-0.5 right-0.5 text-[#E5751F] text-xs">✓</span>
                  )}
                  <div className="flex justify-center">
                    {sentimentMap[sentiment].icon}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { key: '1week', label: '1W' },
                { key: '2weeks', label: '2W' },
                { key: '1month', label: '1M' },
                { key: '3months', label: '3M' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilters(prev => ({ ...prev, timeRange: prev.timeRange === key ? null : key }))}
                  className={`py-2.5 px-3 text-xs font-semibold rounded border transition-all text-center ${
                    filters.timeRange === key
                      ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                      : 'bg-gray-800/40 border-gray-700 text-gray-400'
                  }`}
                >
                  {filters.timeRange === key && '✓ '}{label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleFilter(null, 'buySide')}
                className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                  filters.buySide
                    ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                    : 'bg-gray-800/40 border-gray-700 text-gray-400'
                }`}
              >
                {filters.buySide && '✓ '}Buy Side
              </button>
              <button
                onClick={() => toggleFilter(null, 'sellSide')}
                className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                  filters.sellSide
                    ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                    : 'bg-gray-800/40 border-gray-700 text-gray-400'
                }`}
              >
                {filters.sellSide && '✓ '}Sell Side
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['single', 'split', 'sweep', 'block'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter(null, type)}
                  className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all capitalize ${
                    filters[type]
                      ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                      : 'bg-gray-800/40 border-gray-700 text-gray-400'
                  }`}
                >
                  {filters[type] && '✓ '}{type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleFilter(null, 'stocks')}
                className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                  filters.stocks
                    ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                    : 'bg-gray-800/40 border-gray-700 text-gray-400'
                }`}
              >
                {filters.stocks && '✓ '}Stocks
              </button>
              <button
                onClick={() => toggleFilter(null, 'etfs')}
                className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                  filters.etfs
                    ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                    : 'bg-gray-800/40 border-gray-700 text-gray-400'
                }`}
              >
                {filters.etfs && '✓ '}ETFs
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['calls', 'puts', 'spreads'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter(null, type)}
                  className={`py-2.5 px-2 text-sm font-semibold rounded border transition-all capitalize ${
                    filters[type]
                      ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                      : 'bg-gray-800/40 border-gray-700 text-gray-400'
                  }`}
                >
                  {filters[type] && '✓ '}{type}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'otm', label: 'Out of the money' },
                { key: 'volumeOI', label: 'Volume > OI' },
                { key: 'earnings', label: 'Upcoming earnings' },
                { key: 'aboveAskBelowBid', label: 'Above ask or below bid' },
                { key: 'showExpired', label: 'Show expired' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2.5 text-sm cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={() => toggleFilter(null, key)}
                      className="w-5 h-5 appearance-none rounded border-2 border-[#E5751F] bg-[#3d1a22] cursor-pointer checked:bg-[#E5751F] checked:border-[#E5751F] transition-colors"
                    />
                    {filters[key] && (
                      <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none" viewBox="0 0 16 16" fill="none">
                        <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="group-hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Price was</label>
                <div className="flex items-center gap-1.5">
                  <select
                    className="flex-1 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                    value={filters.priceOperator}
                    onChange={(e) => setFilters({...filters, priceOperator: e.target.value})}
                  >
                    <option value="less">Less than</option>
                    <option value="greater">Greater than</option>
                  </select>
                  <span className="text-gray-400 text-xs">$</span>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-20 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                    value={filters.priceValue}
                    onChange={(e) => setFilters({...filters, priceValue: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Chance was</label>
                <div className="flex items-center gap-1.5">
                  <select
                    className="flex-1 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                    value={filters.chanceOperator}
                    onChange={(e) => setFilters({...filters, chanceOperator: e.target.value})}
                  >
                    <option value="less">Less than</option>
                    <option value="greater">Greater than</option>
                  </select>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-20 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                    value={filters.chanceValue}
                    onChange={(e) => setFilters({...filters, chanceValue: e.target.value})}
                  />
                  <span className="text-gray-400 text-xs">%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setFilters({
                  tickers: [],
                  sentiment: {
                    veryBearish: true,
                    bearish: true,
                    neutral: true,
                    directional: true,
                    bullish: true,
                    veryBullish: true
                  },
                  buySide: true,
                  sellSide: true,
                  single: true,
                  split: true,
                  sweep: true,
                  block: true,
                  stocks: true,
                  etfs: true,
                  calls: true,
                  puts: true,
                  spreads: true,
                  minPremium: 0,
                  maxExpiration: 181,
                  otm: false,
                  volumeOI: false,
                  earnings: false,
                  aboveAskBelowBid: false,
                  smallCap: false,
                  priceOperator: 'less',
                  priceValue: '',
                  chanceOperator: 'less',
                  chanceValue: '',
                  dateFrom: null,
                  dateTo: null,
                  timeRange: null,
                  showExpired: false
                });
                setSelectedRows(new Set());
              }}
              className="w-full bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 py-2.5 rounded font-semibold text-sm transition-colors"
            >
              Reset Filter
            </button>

            <div className="text-center text-xs text-gray-500 pt-1">
              Showing {Math.round((filteredData.length / flowData.length) * 100)}% of total flow ({filteredData.length} / {flowData.length})
            </div>
          </div>
          )}
          </>
          ) : (
            /* Lists Tab - TradingView Style */
            !user ? (
              <div className="text-center text-gray-400 py-12">
                <User className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-sm mb-3">Log in to use watchlists</p>
                <button
                  onClick={() => setShowAuthOverlay(true)}
                  className="px-4 py-2 bg-[#861F41] hover:bg-[#6b1835] rounded text-sm font-semibold transition-colors text-white"
                >
                  Log In
                </button>
              </div>
            ) : (
            <div className="space-y-4">
              {/* List Header with Name and Add Button */}
              <div className="flex items-center justify-between">
                <div className="relative flex-1" ref={listMenuRef}>
                  <button
                    className="text-gray-200 font-medium text-base hover:text-[#E5751F] transition-colors flex items-center gap-1"
                    onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                    title="Manage lists"
                  >
                    {activeList.name}
                    <svg className={`w-4 h-4 transition-transform ${isListMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isListMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#3d1a22] border border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          setNewListNameInput(activeList.name);
                          setIsRenameListModalOpen(true);
                          setIsListMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1a1f4a] transition-colors"
                      >
                        Rename List
                      </button>
                      <button
                        onClick={() => {
                          setNewListNameInput('');
                          setIsAddListModalOpen(true);
                          setIsListMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1a1f4a] transition-colors"
                      >
                        Create New List
                      </button>
                      {lists.length > 1 && (
                        <button
                          onClick={() => {
                            setIsListMenuOpen(false);
                            if (window.confirm(`Delete "${activeList.name}"?`)) {
                              deleteList(activeListId);
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#1a1f4a] transition-colors border-t border-gray-700"
                        >
                          Delete List
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsAddTickerModalOpen(true)}
                  className="text-gray-400 hover:text-[#E5751F] transition-colors"
                  title="Add ticker"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Letter Shortcuts */}
              {lists.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {lists.map(list => {
                    const firstLetter = list.name.charAt(0).toUpperCase();
                    return (
                      <button
                        key={list.id}
                        onClick={() => setActiveListId(list.id)}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-all ${
                          list.id === activeListId
                            ? 'bg-[#861F41] text-white'
                            : 'bg-[#3d1a22] text-gray-400 hover:text-gray-200 hover:bg-[#1a1f4a]'
                        }`}
                        title={list.name}
                      >
                        {firstLetter}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tickers List */}
              {activeList.tickers.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  No tickers in this list yet.
                  <br />
                  Click the + button to add one.
                </div>
              ) : (
                <div className="space-y-1">
                  {activeList.tickers.map((ticker, index) => (
                    <div key={ticker} className="relative">
                      {/* Drop indicator line */}
                      {dragOverIndex === index && draggedTickerIndex !== index && (
                        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-[#E5751F] z-10" />
                      )}

                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`bg-[#3d1a22] border rounded px-3 py-2 flex items-center gap-2 transition-all group cursor-move ${
                          draggedTickerIndex === index
                            ? 'opacity-40'
                            : 'border-gray-700 hover:border-[#E5751F]'
                        }`}
                      >
                        {/* Drag Handle */}
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zM13 3h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                        </svg>

                        <span
                          className="text-gray-200 text-sm font-medium group-hover:text-[#E5751F] transition-colors flex-1 cursor-pointer"
                          onClick={() => handleTickerClick(ticker)}
                        >
                          {ticker}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(ticker);
                          }}
                          className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Drop indicator line at bottom for last item */}
                      {dragOverIndex === index && draggedTickerIndex !== null && draggedTickerIndex < index && index === activeList.tickers.length - 1 && (
                        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#E5751F] z-10" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )
          )}
          </div>
          </div>
        </div>

        {/* Mobile/Tablet Filter Drawer */}
        <div className={`xl:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isFilterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFilterDrawerOpen(false)}
          ></div>

          {/* Drawer */}
          <div className={`absolute bottom-0 left-0 right-0 bg-[#2d1118] border-t border-gray-800 rounded-t-2xl transition-transform duration-300 ${isFilterDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
               style={{ maxHeight: '85vh' }}>
            {/* Drawer Handle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-[#2d1118] z-10">
              <h2 className="text-lg font-semibold text-white">{sidebarTab === 'filters' ? 'Filters' : 'Lists'}</h2>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
              {/* Top-level tabs: Filters / Lists - Apple Style Segmented Control */}
              <div className="p-4 border-b border-gray-800 sticky top-0 bg-[#2d1118] z-10">
                <div className="bg-[#3d1a22] p-1 rounded-lg inline-flex w-full">
                  <button
                    onClick={() => setSidebarTab('filters')}
                    className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      sidebarTab === 'filters'
                        ? 'bg-[#861F41] text-white shadow-lg'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Filters
                  </button>
                  <button
                    onClick={() => setSidebarTab('lists')}
                    className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      sidebarTab === 'lists'
                        ? 'bg-[#861F41] text-white shadow-lg'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Lists
                  </button>
                </div>
              </div>

              <div className="p-4">

              {sidebarTab === 'filters' ? (
                <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-3 py-2.5 rounded font-semibold text-sm transition-colors text-center ${
                    activeTab === 'current'
                      ? 'bg-[#861F41] text-white'
                      : 'bg-transparent border border-gray-700 text-gray-300'
                  }`}
                >
                  Current Filter
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-3 py-2.5 rounded font-semibold text-sm transition-colors text-center ${
                    activeTab === 'saved'
                      ? 'bg-[#861F41] text-white'
                      : 'bg-transparent border border-gray-700 text-gray-300'
                  }`}
                >
                  Your Filters
                </button>
              </div>

              {activeTab === 'saved' ? (
                <div className="space-y-3">
                  {presetFilters.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        applyPresetFilter(preset);
                        setIsFilterDrawerOpen(false);
                      }}
                      className="w-full bg-[#3d1a22] border border-gray-700 hover:border-gray-600 rounded p-3 text-left transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: preset.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-200 group-hover:text-white">
                            {preset.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {preset.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-normal mb-2 text-gray-300">Tickers:</label>

                    {/* Selected tickers */}
                    {filters.tickers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {filters.tickers.map(ticker => (
                          <span
                            key={ticker}
                            onClick={() => removeTicker(ticker)}
                            className="inline-flex items-center gap-1 bg-[#861F41] hover:bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all group"
                          >
                            <span className="group-hover:line-through">{ticker}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTicker(ticker);
                              }}
                              className="hover:text-red-300 ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Input with suggestions */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Add a ticker"
                        className="w-full bg-[#3d1a22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#E5751F] placeholder:text-gray-500"
                        value={tickerInput}
                        onChange={handleTickerInputChange}
                        onKeyDown={handleTickerKeyDown}
                      />

                      {/* Suggestions dropdown */}
                      {tickerSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[#3d1a22] border border-gray-700 rounded max-h-40 overflow-y-auto shadow-lg">
                          {tickerSuggestions.map((ticker, index) => (
                            <button
                              key={ticker}
                              onClick={() => addTicker(ticker)}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                index === selectedSuggestionIndex
                                  ? 'bg-[#861F41] text-white'
                                  : 'hover:bg-[#861F41]/50'
                              }`}
                            >
                              {ticker}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-normal mb-2 text-gray-300">
                      Minimum premium: <span className="font-bold text-white">
                        {filters.minPremium > 0 ? `$${filters.minPremium}m` : 'All premiums'}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.minPremium}
                      onChange={(e) => setFilters({...filters, minPremium: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-[#E5751F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal mb-2 text-gray-300">
                      Expiration: <span className="font-bold text-white">
                        {filters.maxExpiration >= 181 ? 'All expirations' : `${filters.maxExpiration} days`}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="181"
                      value={filters.maxExpiration}
                      onChange={(e) => setFilters({...filters, maxExpiration: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-[#E5751F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal mb-2 text-gray-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Trade Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">From</label>
                        <DatePicker
                          selected={filters.dateFrom}
                          onChange={(date) => setFilters({...filters, dateFrom: date})}
                          selectsStart
                          startDate={filters.dateFrom}
                          endDate={filters.dateTo}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select start"
                          isClearable
                          popperPlacement="bottom"
                          className="w-full bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">To</label>
                        <DatePicker
                          selected={filters.dateTo}
                          onChange={(date) => setFilters({...filters, dateTo: date})}
                          selectsEnd
                          startDate={filters.dateFrom}
                          endDate={filters.dateTo}
                          minDate={filters.dateFrom}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select end"
                          isClearable
                          popperPlacement="bottom"
                          className="w-full bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F] text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { key: 'veryBearish', sentiment: 0 },
                      { key: 'bearish', sentiment: 1 },
                      { key: 'neutral', sentiment: 2 },
                      { key: 'directional', sentiment: 3 },
                      { key: 'bullish', sentiment: 4 },
                      { key: 'veryBullish', sentiment: 5 }
                    ].map(({ key, sentiment }) => (
                      <button
                        key={key}
                        onClick={() => toggleFilter('sentiment', key)}
                        className={`py-2.5 px-1 rounded border transition-all relative ${
                          filters.sentiment[key]
                            ? 'bg-[#861F41]/20 border-[#861F41]'
                            : 'bg-gray-800/40 border-gray-700'
                        }`}
                        title={sentimentMap[sentiment].label}
                      >
                        {filters.sentiment[key] && (
                          <span className="absolute top-0.5 right-0.5 text-[#E5751F] text-xs">✓</span>
                        )}
                        <div className="flex justify-center">
                          {sentimentMap[sentiment].icon}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: '1week', label: '1W' },
                      { key: '2weeks', label: '2W' },
                      { key: '1month', label: '1M' },
                      { key: '3months', label: '3M' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilters(prev => ({ ...prev, timeRange: prev.timeRange === key ? null : key }))}
                        className={`py-2.5 px-3 text-xs font-semibold rounded border transition-all text-center ${
                          filters.timeRange === key
                            ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                            : 'bg-gray-800/40 border-gray-700 text-gray-400'
                        }`}
                      >
                        {filters.timeRange === key && '✓ '}{label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleFilter(null, 'buySide')}
                      className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                        filters.buySide
                          ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                          : 'bg-gray-800/40 border-gray-700 text-gray-400'
                      }`}
                    >
                      {filters.buySide && '✓ '}Buy Side
                    </button>
                    <button
                      onClick={() => toggleFilter(null, 'sellSide')}
                      className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                        filters.sellSide
                          ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                          : 'bg-gray-800/40 border-gray-700 text-gray-400'
                      }`}
                    >
                      {filters.sellSide && '✓ '}Sell Side
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {['single', 'split', 'sweep', 'block'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter(null, type)}
                        className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all capitalize ${
                          filters[type]
                            ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                            : 'bg-gray-800/40 border-gray-700 text-gray-400'
                        }`}
                      >
                        {filters[type] && '✓ '}{type}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleFilter(null, 'stocks')}
                      className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                        filters.stocks
                          ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                          : 'bg-gray-800/40 border-gray-700 text-gray-400'
                      }`}
                    >
                      {filters.stocks && '✓ '}Stocks
                    </button>
                    <button
                      onClick={() => toggleFilter(null, 'etfs')}
                      className={`py-2.5 px-3 text-sm font-semibold rounded border transition-all ${
                        filters.etfs
                          ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                          : 'bg-gray-800/40 border-gray-700 text-gray-400'
                      }`}
                    >
                      {filters.etfs && '✓ '}ETFs
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['calls', 'puts', 'spreads'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter(null, type)}
                        className={`py-2.5 px-2 text-sm font-semibold rounded border transition-all capitalize ${
                          filters[type]
                            ? 'bg-[#861F41]/20 border-[#861F41] text-[#E5751F]'
                            : 'bg-gray-800/40 border-gray-700 text-gray-400'
                        }`}
                      >
                        {filters[type] && '✓ '}{type}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'otm', label: 'Out of the money' },
                      { key: 'volumeOI', label: 'Volume > OI' },
                      { key: 'earnings', label: 'Upcoming earnings' },
                      { key: 'aboveAskBelowBid', label: 'Above ask or below bid' },
                      { key: 'showExpired', label: 'Show expired' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2.5 text-sm cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={filters[key]}
                            onChange={() => toggleFilter(null, key)}
                            className="w-5 h-5 appearance-none rounded border-2 border-[#E5751F] bg-[#3d1a22] cursor-pointer checked:bg-[#E5751F] checked:border-[#E5751F] transition-colors"
                          />
                          {filters[key] && (
                            <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none" viewBox="0 0 16 16" fill="none">
                              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="group-hover:text-white transition-colors">{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Price was</label>
                      <div className="flex items-center gap-1.5">
                        <select
                          className="flex-1 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                          value={filters.priceOperator}
                          onChange={(e) => setFilters({...filters, priceOperator: e.target.value})}
                        >
                          <option value="less">Less than</option>
                          <option value="greater">Greater than</option>
                        </select>
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="text"
                          placeholder="0"
                          className="w-20 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                          value={filters.priceValue}
                          onChange={(e) => setFilters({...filters, priceValue: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Chance was</label>
                      <div className="flex items-center gap-1.5">
                        <select
                          className="flex-1 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                          value={filters.chanceOperator}
                          onChange={(e) => setFilters({...filters, chanceOperator: e.target.value})}
                        >
                          <option value="less">Less than</option>
                          <option value="greater">Greater than</option>
                        </select>
                        <input
                          type="text"
                          placeholder="0"
                          className="w-20 bg-[#3d1a22] border border-gray-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#E5751F]"
                          value={filters.chanceValue}
                          onChange={(e) => setFilters({...filters, chanceValue: e.target.value})}
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFilters({
                        tickers: [],
                        sentiment: {
                          veryBearish: true,
                          bearish: true,
                          neutral: true,
                          directional: true,
                          bullish: true,
                          veryBullish: true
                        },
                        buySide: true,
                        sellSide: true,
                        single: true,
                        split: true,
                        sweep: true,
                        block: true,
                        stocks: true,
                        etfs: true,
                        calls: true,
                        puts: true,
                        spreads: true,
                        minPremium: 0,
                        maxExpiration: 181,
                        otm: false,
                        volumeOI: false,
                        earnings: false,
                        aboveAskBelowBid: false,
                        smallCap: false,
                        priceOperator: 'less',
                        priceValue: '',
                        chanceOperator: 'less',
                        chanceValue: '',
                        dateFrom: null,
                        dateTo: null,
                        timeRange: null,
                        showExpired: false
                      });
                      setSelectedRows(new Set());
                    }}
                    className="w-full bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 py-2.5 rounded font-semibold text-sm transition-colors"
                  >
                    Reset Filter
                  </button>

                  <div className="text-center text-xs text-gray-500 pt-1">
                    Showing {Math.round((filteredData.length / flowData.length) * 100)}% of total flow ({filteredData.length} / {flowData.length})
                  </div>
                </div>
              )}
              </>
              ) : (
                /* Lists Tab - Mobile - TradingView Style */
                !user ? (
                  <div className="text-center text-gray-400 py-12">
                    <User className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                    <p className="text-sm mb-3">Log in to use watchlists</p>
                    <button
                      onClick={() => { setShowAuthOverlay(true); setIsFilterDrawerOpen(false); }}
                      className="px-4 py-2 bg-[#861F41] hover:bg-[#6b1835] rounded text-sm font-semibold transition-colors text-white"
                    >
                      Log In
                    </button>
                  </div>
                ) : (
                <div className="space-y-4">
                  {/* List Header with Name and Add Button */}
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                      <button
                        className="text-gray-200 font-medium text-base active:text-[#E5751F] transition-colors flex items-center gap-1"
                        onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                      >
                        {activeList.name}
                        <svg className={`w-4 h-4 transition-transform ${isListMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {isListMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-[#3d1a22] border border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                          <button
                            onClick={() => {
                              setNewListNameInput(activeList.name);
                              setIsRenameListModalOpen(true);
                              setIsListMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 active:bg-[#1a1f4a] transition-colors"
                          >
                            Rename List
                          </button>
                          <button
                            onClick={() => {
                              setNewListNameInput('');
                              setIsAddListModalOpen(true);
                              setIsListMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 active:bg-[#1a1f4a] transition-colors"
                          >
                            Create New List
                          </button>
                          {lists.length > 1 && (
                            <button
                              onClick={() => {
                                setIsListMenuOpen(false);
                                if (window.confirm(`Delete "${activeList.name}"?`)) {
                                  deleteList(activeListId);
                                }
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-400 active:bg-[#1a1f4a] transition-colors border-t border-gray-700"
                            >
                              Delete List
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setIsAddTickerModalOpen(true)}
                      className="text-gray-400 active:text-[#E5751F] transition-colors p-1"
                      title="Add ticker"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Letter Shortcuts */}
                  {lists.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {lists.map(list => {
                        const firstLetter = list.name.charAt(0).toUpperCase();
                        return (
                          <button
                            key={list.id}
                            onClick={() => setActiveListId(list.id)}
                            className={`w-8 h-8 rounded text-sm font-semibold transition-all ${
                              list.id === activeListId
                                ? 'bg-[#861F41] text-white'
                                : 'bg-[#3d1a22] text-gray-400 active:bg-[#1a1f4a]'
                            }`}
                            title={list.name}
                          >
                            {firstLetter}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tickers List */}
                  {activeList.tickers.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No tickers in this list yet.
                      <br />
                      Click the + button to add one.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activeList.tickers.map((ticker, index) => (
                        <div key={ticker} className="relative">
                          {/* Drop indicator line */}
                          {dragOverIndex === index && draggedTickerIndex !== index && (
                            <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-[#E5751F] z-10" />
                          )}

                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`bg-[#3d1a22] border rounded px-3 py-2.5 flex items-center gap-2 transition-all group ${
                              draggedTickerIndex === index
                                ? 'opacity-40'
                                : 'border-gray-700 active:border-[#E5751F]'
                            }`}
                          >
                            {/* Drag Handle */}
                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zM13 3h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                            </svg>

                            <span
                              className="text-gray-200 text-sm font-medium flex-1"
                              onClick={() => {
                                handleTickerClick(ticker);
                                setIsFilterDrawerOpen(false);
                              }}
                            >
                              {ticker}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWatchlist(ticker);
                              }}
                              className="text-gray-500 active:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Drop indicator line at bottom for last item */}
                          {dragOverIndex === index && draggedTickerIndex !== null && draggedTickerIndex < index && index === activeList.tickers.length - 1 && (
                            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#E5751F] z-10" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Floating Menu Button */}
      <button
        onClick={() => setIsFilterDrawerOpen(true)}
        className="xl:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#861F41] hover:bg-[#6b1835] rounded-full shadow-lg flex items-center justify-center transition-all z-40"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>



      {/* Add Ticker Modal */}
      {isAddTickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddTickerModalOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Ticker to List</h3>
              <button
                onClick={() => setIsAddTickerModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter ticker symbol (e.g., AAPL)"
                  className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] placeholder:text-gray-500 text-white"
                  value={newTickerInput}
                  onChange={handleListTickerInputChange}
                  onKeyDown={handleListTickerKeyDown}
                  autoFocus
                />

                {/* Suggestions dropdown */}
                {listTickerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#3d1a22] border border-gray-700 rounded max-h-40 overflow-y-auto shadow-lg">
                    {listTickerSuggestions.map((ticker, index) => (
                      <button
                        key={ticker}
                        onClick={() => handleAddTickerSubmit(ticker)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          index === listSelectedSuggestionIndex
                            ? 'bg-[#861F41] text-white'
                            : 'text-white hover:bg-[#861F41]/50'
                        }`}
                      >
                        {ticker}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddTickerModalOpen(false)}
                  className="flex-1 bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 py-2.5 rounded font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTickerSubmit()}
                  className="flex-1 bg-[#861F41] hover:bg-[#6b1835] text-white py-2.5 rounded font-semibold text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add List Modal */}
      {isAddListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddListModalOpen(false)}
          ></div>

          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New List</h3>
              <button
                onClick={() => setIsAddListModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter list name (e.g., Position List)"
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] placeholder:text-gray-500 text-white"
                value={newListNameInput}
                onChange={(e) => setNewListNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddListSubmit();
                  } else if (e.key === 'Escape') {
                    setIsAddListModalOpen(false);
                  }
                }}
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddListModalOpen(false)}
                  className="flex-1 bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 py-2.5 rounded font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddListSubmit}
                  className="flex-1 bg-[#861F41] hover:bg-[#6b1835] text-white py-2.5 rounded font-semibold text-sm transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename List Modal */}
      {isRenameListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsRenameListModalOpen(false)}
          ></div>

          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Rename List</h3>
              <button
                onClick={() => setIsRenameListModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter new list name"
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] placeholder:text-gray-500 text-white"
                value={newListNameInput}
                onChange={(e) => setNewListNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameListSubmit();
                  } else if (e.key === 'Escape') {
                    setIsRenameListModalOpen(false);
                  }
                }}
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setIsRenameListModalOpen(false)}
                  className="flex-1 bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 py-2.5 rounded font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameListSubmit}
                  className="flex-1 bg-[#861F41] hover:bg-[#6b1835] text-white py-2.5 rounded font-semibold text-sm transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Auth Overlay */}
      {showAuthOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthOverlay(false)}></div>
          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </h3>
              <button onClick={() => setShowAuthOverlay(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {authError && <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{authError}</div>}
            <form onSubmit={handleAuth} className="space-y-3">
              {authMode === 'register' && (
                <input type="text" placeholder="Name" value={authForm.name}
                  onChange={e => setAuthForm(f => ({...f, name: e.target.value}))}
                  className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
              )}
              <input type="text" placeholder="Email or Username" required value={authForm.email}
                onChange={e => setAuthForm(f => ({...f, email: e.target.value}))}
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
              <input type="password" placeholder="Password" required value={authForm.password}
                onChange={e => setAuthForm(f => ({...f, password: e.target.value}))}
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
              <button type="submit" disabled={authLoading}
                className="w-full bg-[#861F41] hover:bg-[#6b1835] disabled:bg-gray-600 text-white py-3 rounded font-semibold text-sm transition-colors">
                {authLoading ? 'Loading...' : (authMode === 'login' ? 'Log In' : 'Create Account')}
              </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-400">
              {authMode === 'login' ? (
                <>Don't have an account? <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-[#E5751F] hover:underline">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-[#E5751F] hover:underline">Log in</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChangePassword(false)}></div>
          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Change Password
              </h3>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {changePasswordError && <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{changePasswordError}</div>}
            {changePasswordSuccess && <div className="mb-3 p-2 bg-green-900/50 border border-green-700 rounded text-green-300 text-sm">{changePasswordSuccess}</div>}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" placeholder="Current Password" required value={changePasswordForm.currentPassword}
                onChange={e => setChangePasswordForm(f => ({...f, currentPassword: e.target.value}))}
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
              <input type="password" placeholder="New Password" required value={changePasswordForm.newPassword}
                onChange={e => setChangePasswordForm(f => ({...f, newPassword: e.target.value}))}
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
              <input type="password" placeholder="Confirm New Password" required value={changePasswordForm.confirmPassword}
                onChange={e => setChangePasswordForm(f => ({...f, confirmPassword: e.target.value}))}
                className="w-full bg-[#3d1a22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
              <button type="submit" disabled={changePasswordLoading}
                className="w-full bg-[#861F41] hover:bg-[#6b1835] disabled:bg-gray-600 text-white py-3 rounded font-semibold text-sm transition-colors">
                {changePasswordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminPanel(false)}></div>
          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E5751F]" /> Admin Dashboard
              </h3>
              <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {adminStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#3d1a22] rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-xs uppercase mb-1">Total Flow Events</div>
                  <div className="text-2xl font-bold text-white">{adminStats.totalFlows?.toLocaleString()}</div>
                </div>
                <div className="bg-[#3d1a22] rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-xs uppercase mb-1">Unique Symbols</div>
                  <div className="text-2xl font-bold text-white">{adminStats.uniqueSymbols?.toLocaleString()}</div>
                </div>
                <div className="bg-[#3d1a22] rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-xs uppercase mb-1">Registered Users</div>
                  <div className="text-2xl font-bold text-white">{adminStats.totalUsers}</div>
                </div>
                <div className="bg-[#3d1a22] rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-xs uppercase mb-1">Watchlists</div>
                  <div className="text-2xl font-bold text-white">{adminStats.totalWatchlists}</div>
                </div>
                {adminStats.dateRange && (
                  <div className="col-span-2 bg-[#3d1a22] rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-xs uppercase mb-1">Data Range</div>
                    <div className="text-sm text-white">
                      {new Date(adminStats.dateRange.from).toLocaleDateString()} — {new Date(adminStats.dateRange.to).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">Loading stats...</div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-3">Create User</h4>
              {createUserError && <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{createUserError}</div>}
              {createUserSuccess && <div className="mb-3 p-2 bg-green-900/50 border border-green-700 rounded text-green-300 text-sm">{createUserSuccess}</div>}
              <form onSubmit={handleCreateUser} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Email / Username" required value={createUserForm.email}
                    onChange={e => setCreateUserForm(f => ({...f, email: e.target.value}))}
                    className="bg-[#3d1a22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
                  <input type="password" placeholder="Password" required value={createUserForm.password}
                    onChange={e => setCreateUserForm(f => ({...f, password: e.target.value}))}
                    className="bg-[#3d1a22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Name (optional)" value={createUserForm.name}
                    onChange={e => setCreateUserForm(f => ({...f, name: e.target.value}))}
                    className="bg-[#3d1a22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#E5751F] text-white placeholder:text-gray-500" />
                  <select value={createUserForm.role}
                    onChange={e => setCreateUserForm(f => ({...f, role: e.target.value}))}
                    className="bg-[#3d1a22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#E5751F] text-white">
                    <option value="trader">Trader</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit"
                  className="w-full bg-[#861F41] hover:bg-[#6b1835] text-white py-2 rounded font-semibold text-sm transition-colors">
                  Create User
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showReportsPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportsPanel(false)}></div>
          <div className="relative bg-[#2d1118] border border-gray-700 rounded-lg w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-0">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#E5751F]" /> Reports
              </h3>
              <button onClick={() => setShowReportsPanel(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 pt-4">
              <div className="bg-[#3d1a22] p-1 rounded-lg inline-flex w-full">
                <button
                  onClick={() => switchReportTab('topSymbols')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                    reportTab === 'topSymbols'
                      ? 'bg-[#861F41] text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Top Symbols by Premium
                </button>
                <button
                  onClick={() => switchReportTab('dailyActivity')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                    reportTab === 'dailyActivity'
                      ? 'bg-[#861F41] text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Daily Flow Activity
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {reportsLoading ? (
                <div className="text-center text-gray-400 py-12">Loading report data...</div>
              ) : reportTab === 'topSymbols' ? (
                topSymbolsData && topSymbolsData.length > 0 ? (
                  <div>
                    <p className="text-gray-400 text-xs mb-4">
                      Aggregates all flow events by ticker symbol (GROUP BY symbol), joined with the ticker_symbols
                      collection ($lookup). Shows the top 20 symbols ranked by total premium volume.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#3d1a22] text-gray-400 text-xs uppercase">
                            <th className="text-left px-3 py-2.5">#</th>
                            <th className="text-left px-3 py-2.5">Symbol</th>
                            <th className="text-right px-3 py-2.5">Total Premium</th>
                            <th className="text-right px-3 py-2.5">Trades</th>
                            <th className="text-right px-3 py-2.5">Max Single</th>
                            <th className="text-right px-3 py-2.5">Avg Sentiment</th>
                            <th className="text-right px-3 py-2.5">Sweeps</th>
                            <th className="text-right px-3 py-2.5">Blocks</th>
                            <th className="text-right px-3 py-2.5">Buy/Sell</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSymbolsData.map((row, i) => {
                            const sentLabel = row.avgSentiment < 2 ? 'Bearish' : row.avgSentiment > 3 ? 'Bullish' : 'Neutral';
                            const sentColor = row.avgSentiment < 2 ? 'text-red-400' : row.avgSentiment > 3 ? 'text-green-400' : 'text-gray-400';
                            return (
                              <tr key={row.symbol} className="border-b border-gray-800 hover:bg-[#3d1a22] transition-colors">
                                <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                                <td className="px-3 py-2.5 font-semibold text-[#E5751F]">{row.symbol}</td>
                                <td className="px-3 py-2.5 text-right text-white font-mono">
                                  ${(row.totalPremium / 1e9).toFixed(2)}B
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-300">{row.tradeCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-gray-300">{formatPremium(row.maxPremium)}</td>
                                <td className={`px-3 py-2.5 text-right ${sentColor}`}>
                                  {row.avgSentiment} ({sentLabel})
                                </td>
                                <td className="px-3 py-2.5 text-right text-orange-400">{row.sweepCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-[#E5751F]">{row.blockCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-gray-300">
                                  {row.buyCount.toLocaleString()} / {row.sellCount.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-gray-500 text-xs">
                      Query: flow_events $group by symbol + $lookup ticker_symbols | {topSymbolsData.length} rows
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">No data available</div>
                )
              ) : (
                dailyActivityData && dailyActivityData.length > 0 ? (
                  <div>
                    <p className="text-gray-400 text-xs mb-4">
                      Aggregates all flow events by trade date (GROUP BY date), joined with the users
                      collection ($lookup) for system context. Shows daily premium volume, trade counts, and flow type breakdown.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#3d1a22] text-gray-400 text-xs uppercase">
                            <th className="text-left px-3 py-2.5">Date</th>
                            <th className="text-right px-3 py-2.5">Total Premium</th>
                            <th className="text-right px-3 py-2.5">Trades</th>
                            <th className="text-right px-3 py-2.5">Symbols</th>
                            <th className="text-right px-3 py-2.5">Avg Sent.</th>
                            <th className="text-right px-3 py-2.5">Sweep</th>
                            <th className="text-right px-3 py-2.5">Block</th>
                            <th className="text-right px-3 py-2.5">Split</th>
                            <th className="text-right px-3 py-2.5">Single</th>
                            <th className="text-right px-3 py-2.5">Buy/Sell</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyActivityData.map((row) => {
                            const sentColor = row.avgSentiment < 2 ? 'text-red-400' : row.avgSentiment > 3 ? 'text-green-400' : 'text-gray-400';
                            return (
                              <tr key={row.date} className="border-b border-gray-800 hover:bg-[#3d1a22] transition-colors">
                                <td className="px-3 py-2.5 text-white font-mono">{row.date}</td>
                                <td className="px-3 py-2.5 text-right text-white font-mono">
                                  ${(row.totalPremium / 1e6).toFixed(1)}M
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-300">{row.tradeCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-gray-300">{row.uniqueSymbolCount}</td>
                                <td className={`px-3 py-2.5 text-right ${sentColor}`}>{row.avgSentiment}</td>
                                <td className="px-3 py-2.5 text-right text-orange-400">{row.sweepCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-[#E5751F]">{row.blockCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-gray-400">{row.splitCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-gray-500">{row.singleCount.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right text-gray-300">
                                  {row.buyCount.toLocaleString()} / {row.sellCount.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-gray-500 text-xs">
                      Query: flow_events $group by date + $lookup users | {dailyActivityData.length} rows | {dailyActivityData[0]?.registeredUsers} registered users
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">No data available</div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
