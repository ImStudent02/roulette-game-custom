'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// House Fund Card Component
interface HouseFundCardProps {
  cardBg: string;
  border: string;
  textMuted: string;
  inputBg: string;
  text: string;
  onUpdate: () => void;
}

interface HouseTransaction {
  type: string;
  amount: number;
  amountUSD: number;
  balanceAfter: number;
  username?: string;
  adminNote?: string;
  timestamp: number;
}

function HouseFundCard({ cardBg, border, textMuted, inputBg, text, onUpdate }: HouseFundCardProps) {
  const [fund, setFund] = useState<{ balanceMangos: number; balanceUSD: number } | null>(null);
  const [transactions, setTransactions] = useState<HouseTransaction[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFund();
  }, []);

  const fetchFund = async () => {
    try {
      const res = await fetch('/api/admin/house-fund');
      if (res.ok) {
        const data = await res.json();
        setFund(data.fund);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch fund:', err);
    }
  };

  const handleDeposit = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/house-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, note }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✓ Deposited ${amt.toLocaleString()} mangos`);
        setAmount('');
        setNote('');
        fetchFund();
        onUpdate();
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch {
      setMessage('✗ Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/house-fund', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, note }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✓ Withdrew ${amt.toLocaleString()} mangos`);
        setAmount('');
        setNote('');
        fetchFund();
        onUpdate();
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch {
      setMessage('✗ Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString();
  const formatType = (type: string) => type.replace(/_/g, ' ').toUpperCase();

  return (
    <div className={`${cardBg} rounded-lg p-4 border ${border}`}>
      <h3 className="font-medium mb-4">House Fund</h3>
      
      {/* Current Balance */}
      <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30 mb-4">
        <div className={`text-sm ${textMuted}`}>Current Balance</div>
        <div className="text-3xl font-bold text-green-400">
          ${fund ? fund.balanceUSD.toLocaleString() : '0'}
        </div>
      </div>

      {/* Deposit/Withdraw Form */}
      <div className="mb-4 p-4 bg-gray-900/50 rounded-lg">
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (USD)"
              className={`w-full pl-7 ${inputBg} border ${border} rounded px-3 py-2 ${text}`}
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className={`flex-1 ${inputBg} border ${border} rounded px-3 py-2 ${text}`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition"
          >
            {loading ? '...' : 'Deposit USD'}
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded transition"
          >
            {loading ? '...' : 'Withdraw USD'}
          </button>
        </div>
        {message && (
          <div className={`mt-2 text-sm ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className={`text-sm font-medium ${textMuted} mb-2`}>Recent Transactions</div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {transactions.slice(0, 10).map((tx, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-700/50">
              <span className={tx.amountUSD >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatType(tx.type)}
              </span>
              <span className={tx.amountUSD >= 0 ? 'text-green-400' : 'text-red-400'}>
                {tx.amountUSD >= 0 ? '+' : ''}${Math.abs(tx.amountUSD).toLocaleString()}
              </span>
              <span className="text-gray-500">{formatTime(tx.timestamp)}</span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center text-gray-500 py-2">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Types
interface User {
  id: string;
  username: string;
  displayName: string;
  status: 'active' | 'timeout' | 'suspended' | 'banned';
  mangos: number;
  mangoJuice: number;
  fermentedMangos: number;
  lastActive: string;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
}

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  houseFund: number;
  todayProfit: number;
  totalBets: number;
}

interface HyperParams {
  bettingDuration: number;
  lockedDuration: number;
  spinDuration: number;
  resultDuration: number;
  maxBetReal: number;
  maxBetTrial: number;
  protectionThreshold: number;
}

type TabType = 'dashboard' | 'users' | 'logs' | 'settings';

export default function AdminDashboard() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<string>('');
  
  // Data states
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    onlineUsers: 0,
    houseFund: 50000000,
    todayProfit: 0,
    totalBets: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [params, setParams] = useState<HyperParams>({
    bettingDuration: 210,
    lockedDuration: 30,
    spinDuration: 15,
    resultDuration: 45,
    maxBetReal: 100000,
    maxBetTrial: 1000000,
    protectionThreshold: 0.5,
  });

  // Search & filter
  const [userSearch, setUserSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');

  // Check auth
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    const user = sessionStorage.getItem('adminUser');
    
    if (!token) {
      router.push('/auth/admin');
      return;
    }
    
    setAdminUser(user || 'Admin');
    fetchData();
    setLoading(false);
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      // Fetch logs
      const logsRes = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      // Fetch params
      const paramsRes = await fetch('/api/admin/params', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (paramsRes.ok) {
        const paramsData = await paramsRes.json();
        setParams(paramsData);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  }, []);

  const logout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    router.push('/auth/admin');
  };

  const updateUserStatus = async (userId: string, status: User['status']) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ userId, status }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const saveParams = async () => {
    try {
      await fetch('/api/admin/params', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(params),
      });
      alert('Settings saved!');
    } catch (error) {
      console.error('Failed to save params:', error);
    }
  };

  // Theme classes
  const bg = isDark ? 'bg-gray-900' : 'bg-gray-100';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
  const border = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-gray-50';

  // Filter users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.displayName.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filter logs
  const filteredLogs = logFilter === 'all' 
    ? logs 
    : logs.filter(l => l.level === logFilter);

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      {/* Header */}
      <header className={`${cardBg} border-b ${border} px-6 py-4`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <span className={`text-sm ${textMuted}`}>Welcome, {adminUser}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
              title={isDark ? 'Switch to light' : 'Switch to dark'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className={`p-2 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className={`flex gap-1 ${cardBg} rounded-lg p-1 mb-6 w-fit`}>
          {(['dashboard', 'users', 'logs', 'settings'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : `${textMuted} hover:${text}`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
                { label: 'Online Now', value: stats.onlineUsers, color: 'text-green-400' },
                { label: 'House Fund', value: `$${stats.houseFund.toLocaleString()}`, color: 'text-yellow-400' },
                { label: "Today's P/L", value: stats.todayProfit >= 0 ? `+$${stats.todayProfit}` : `-$${Math.abs(stats.todayProfit)}`, color: stats.todayProfit >= 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'Total Bets', value: stats.totalBets.toLocaleString(), color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className={`${cardBg} rounded-lg p-4 border ${border}`}>
                  <div className={`text-sm ${textMuted} mb-1`}>{stat.label}</div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className={`${cardBg} rounded-lg p-4 border ${border}`}>
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="/admin/analytics" 
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition"
                >
                  📊 User Analytics
                </a>
                <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition">
                  Export Users
                </button>
                <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition">
                  Download Logs
                </button>
                <button className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition">
                  Restart Server
                </button>
              </div>
            </div>

            {/* House Fund Management */}
            <HouseFundCard 
              cardBg={cardBg} 
              border={border} 
              textMuted={textMuted}
              inputBg={inputBg}
              text={text}
              onUpdate={fetchData}
            />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={`${cardBg} rounded-lg border ${border}`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-700">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={`w-full max-w-sm ${inputBg} border ${border} rounded-md px-3 py-2 ${text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Mangos</th>
                    <th className="text-right px-4 py-3 font-medium">Juice</th>
                    <th className="text-left px-4 py-3 font-medium">Last Active</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={`border-t ${border} hover:${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.displayName}</div>
                        <div className={`text-xs ${textMuted}`}>@{user.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          user.status === 'timeout' ? 'bg-yellow-500/20 text-yellow-400' :
                          user.status === 'suspended' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{user.mangos.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{user.mangoJuice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{user.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={user.status}
                          onChange={(e) => updateUserStatus(user.id, e.target.value as User['status'])}
                          className={`${inputBg} border ${border} rounded px-2 py-1 text-xs ${text}`}
                        >
                          <option value="active">Active</option>
                          <option value="timeout">Timeout</option>
                          <option value="suspended">Suspend</option>
                          <option value="banned">Ban</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className={`text-center py-8 ${textMuted}`}>No users found</div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className={`${cardBg} rounded-lg border ${border}`}>
            {/* Filter */}
            <div className="p-4 border-b border-gray-700 flex gap-2">
              {(['all', 'error', 'warn', 'info'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-sm capitalize ${
                    logFilter === filter 
                      ? 'bg-blue-600 text-white' 
                      : `${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${textMuted}`
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Logs List */}
            <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-700/30">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                      log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm break-words">{log.message}</div>
                      {log.stack && (
                        <pre className={`mt-2 text-xs ${textMuted} bg-gray-900/50 p-2 rounded overflow-x-auto`}>
                          {log.stack}
                        </pre>
                      )}
                      <div className={`text-xs ${textMuted} mt-1`}>{log.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className={`text-center py-8 ${textMuted}`}>No logs found</div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={`${cardBg} rounded-lg border ${border} p-6`}>
            <h3 className="font-medium mb-6">Game Parameters</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Timer Settings */}
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${textMuted} uppercase tracking-wide`}>Timer (seconds)</h4>
                {[
                  { key: 'bettingDuration', label: 'Betting Duration' },
                  { key: 'lockedDuration', label: 'Locked Duration' },
                  { key: 'spinDuration', label: 'Spin Duration' },
                  { key: 'resultDuration', label: 'Result Duration' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm">{label}</label>
                    <input
                      type="number"
                      value={params[key as keyof HyperParams]}
                      onChange={(e) => setParams({ ...params, [key]: parseInt(e.target.value) })}
                      className={`w-24 ${inputBg} border ${border} rounded px-2 py-1 text-sm ${text} text-right`}
                    />
                  </div>
                ))}
              </div>

              {/* Bet Limits */}
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${textMuted} uppercase tracking-wide`}>Bet Limits</h4>
                {[
                  { key: 'maxBetReal', label: 'Max Bet (Real)' },
                  { key: 'maxBetTrial', label: 'Max Bet (Trial)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm">{label}</label>
                    <input
                      type="number"
                      value={params[key as keyof HyperParams]}
                      onChange={(e) => setParams({ ...params, [key]: parseInt(e.target.value) })}
                      className={`w-32 ${inputBg} border ${border} rounded px-2 py-1 text-sm ${text} text-right`}
                    />
                  </div>
                ))}

                <h4 className={`text-sm font-medium ${textMuted} uppercase tracking-wide mt-6`}>House Protection</h4>
                <div className="flex items-center justify-between">
                  <label className="text-sm">Protection Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={params.protectionThreshold}
                    onChange={(e) => setParams({ ...params, protectionThreshold: parseFloat(e.target.value) })}
                    className={`w-24 ${inputBg} border ${border} rounded px-2 py-1 text-sm ${text} text-right`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={saveParams}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
