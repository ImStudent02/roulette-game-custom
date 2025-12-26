'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserStats {
  _id: string;
  totalSessions: number;
  totalTimeSpent: number;
  totalBetsPlaced: number;
  totalBetsRemoved: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  avgSessionDuration: number;
  avgBetsPerSession: number;
  avgBetSize: number;
  betRemovalRate: number;
  maxSingleBet: number;
  maxLossStreak: number;
  maxWinStreak: number;
  firstSeenAt: number;
  lastSeenAt: number;
  skipRate: number;
}

interface UserSession {
  sessionId: string;
  startedAt: number;
  endedAt: number | null;
  summary: {
    totalDuration: number;
    betsPlaced: number;
    roundsPlayed: number;
  };
}

interface UserEvent {
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: number;
  page: string;
}

type SortField = 'lastSeenAt' | 'totalTimeSpent' | 'totalBetsPlaced' | 'totalWagered' | 'avgBetSize' | 'maxSingleBet';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('lastSeenAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<{
    user: UserStats;
    sessions: UserSession[];
    recentEvents: UserEvent[];
  } | null>(null);
  
  const limit = 20;
  
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: (page * limit).toString(),
        sortBy,
        sortOrder,
        search,
      });
      
      const res = await fetch(`/api/admin/user-analytics?${params}`);
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, router]);
  
  const fetchUserDetail = useCallback(async (username: string) => {
    try {
      const res = await fetch(`/api/admin/user-analytics?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch user detail:', err);
    }
  }, []);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    if (selectedUser) {
      fetchUserDetail(selectedUser);
    } else {
      setUserDetail(null);
    }
  }, [selectedUser, fetchUserDetail]);
  
  const formatDuration = (ms: number) => {
    if (!ms) return '0s';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };
  
  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };
  
  const formatDate = (ts: number) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString();
  };
  
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(0);
  };
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-yellow-400 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold">📊 User Analytics</h1>
          </div>
          <div className="text-sm text-gray-400">
            {total} users tracked
          </div>
        </div>
        
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
          />
        </div>
        
        {/* Main Content */}
        <div className="flex gap-6">
          {/* User List */}
          <div className={`${selectedUser ? 'w-1/2' : 'w-full'} transition-all`}>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Username</th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('lastSeenAt')}
                    >
                      Last Seen <SortIcon field="lastSeenAt" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('totalTimeSpent')}
                    >
                      Time Spent <SortIcon field="totalTimeSpent" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('totalBetsPlaced')}
                    >
                      Bets <SortIcon field="totalBetsPlaced" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('totalWagered')}
                    >
                      Wagered <SortIcon field="totalWagered" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('maxSingleBet')}
                    >
                      Max Bet <SortIcon field="maxSingleBet" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user._id}
                        className={`border-t border-gray-700 cursor-pointer hover:bg-gray-700/50 ${
                          selectedUser === user._id ? 'bg-gray-700' : ''
                        }`}
                        onClick={() => setSelectedUser(selectedUser === user._id ? null : user._id)}
                      >
                        <td className="px-4 py-3 font-medium">{user._id}</td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {formatDate(user.lastSeenAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatDuration(user.totalTimeSpent)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(user.totalBetsPlaced)}
                        </td>
                        <td className="px-4 py-3 text-right text-yellow-400">
                          {formatNumber(user.totalWagered)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-400">
                          {formatNumber(user.maxSingleBet)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page + 1} of {Math.ceil(total / limit)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= total}
                    className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* User Detail Panel */}
          {selectedUser && userDetail && (
            <div className="w-1/2 bg-gray-800 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{userDetail.user._id}</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Sessions</div>
                  <div className="text-lg font-bold">{userDetail.user.totalSessions || 0}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Total Time</div>
                  <div className="text-lg font-bold">{formatDuration(userDetail.user.totalTimeSpent)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Avg Session</div>
                  <div className="text-lg font-bold">{formatDuration(userDetail.user.avgSessionDuration)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Total Bets</div>
                  <div className="text-lg font-bold text-blue-400">{formatNumber(userDetail.user.totalBetsPlaced)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Total Wagered</div>
                  <div className="text-lg font-bold text-yellow-400">{formatNumber(userDetail.user.totalWagered)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Avg Bet Size</div>
                  <div className="text-lg font-bold">{formatNumber(userDetail.user.avgBetSize)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Won</div>
                  <div className="text-lg font-bold text-green-400">{formatNumber(userDetail.user.totalWon)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Lost</div>
                  <div className="text-lg font-bold text-red-400">{formatNumber(userDetail.user.totalLost)}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Max Single Bet</div>
                  <div className="text-lg font-bold text-orange-400">{formatNumber(userDetail.user.maxSingleBet)}</div>
                </div>
              </div>
              
              {/* Risk Indicators */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Risk Indicators</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between bg-gray-700 rounded px-3 py-2">
                    <span className="text-gray-400">Max Loss Streak</span>
                    <span className="text-red-400 font-bold">{userDetail.user.maxLossStreak || 0}</span>
                  </div>
                  <div className="flex justify-between bg-gray-700 rounded px-3 py-2">
                    <span className="text-gray-400">Max Win Streak</span>
                    <span className="text-green-400 font-bold">{userDetail.user.maxWinStreak || 0}</span>
                  </div>
                  <div className="flex justify-between bg-gray-700 rounded px-3 py-2">
                    <span className="text-gray-400">Bet Removal Rate</span>
                    <span className="font-bold">{((userDetail.user.betRemovalRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between bg-gray-700 rounded px-3 py-2">
                    <span className="text-gray-400">Skip Rate</span>
                    <span className="font-bold">{((userDetail.user.skipRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Recent Sessions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Sessions</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userDetail.sessions.map((session) => (
                    <div key={session.sessionId} className="bg-gray-700 rounded px-3 py-2 text-sm">
                      <div className="flex justify-between">
                        <span>{formatDate(session.startedAt)}</span>
                        <span className="text-gray-400">{formatDuration(session.summary.totalDuration)}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {session.summary.betsPlaced} bets, {session.summary.roundsPlayed} rounds
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recent Events */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Events</h3>
                <div className="space-y-1 max-h-60 overflow-y-auto text-xs">
                  {userDetail.recentEvents.map((event, i) => (
                    <div key={i} className="bg-gray-700/50 rounded px-2 py-1 font-mono">
                      <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <span className="text-yellow-400 ml-2">{event.eventType}</span>
                      <span className="text-gray-400 ml-2">{event.page}</span>
                      {Object.keys(event.eventData || {}).length > 0 && (
                        <span className="text-gray-500 ml-2">
                          {JSON.stringify(event.eventData).slice(0, 50)}...
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
