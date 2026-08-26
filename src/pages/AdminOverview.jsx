import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Loader2
} from 'lucide-react'

export const AdminOverview = () => {
  const { isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    netBalance: 0
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData()
    }
  }, [isSuperAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get total members
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'APPROVED')

      // Get transactions totals
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')

      let deposits = 0
      let withdrawals = 0
      transactions?.forEach(t => {
        if (t.type === 'DEPOSIT') deposits += parseFloat(t.amount)
        else withdrawals += parseFloat(t.amount)
      })

      // Get audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admins (email)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // Get recent transactions
      const { data: recent } = await supabase
        .from('transactions')
        .select(`
          *,
          admins (email),
          members (name, member_code)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      setStats({
        totalMembers: memberCount || 0,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        netBalance: deposits - withdrawals
      })
      setAuditLogs(logs || [])
      setRecentTransactions(recent || [])
    } catch (error) {
      console.error('Error fetching overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">
                ₦{stats.totalDeposits.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-600">
                ₦{stats.totalWithdrawals.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Balance</p>
              <p className="text-2xl font-bold text-blue-600">
                ₦{stats.netBalance.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent transactions</p>
              ) : (
                recentTransactions.map((t) => (
                  <div key={t.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {t.members?.name || 'Unknown Member'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t.admins?.email || 'Unknown Admin'} • {new Date(t.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${
                        t.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'DEPOSIT' ? '+' : '-'}₦{parseFloat(t.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No audit logs yet</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.action}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.admins?.email || 'Unknown Admin'} • {new Date(log.created_at).toLocaleString()}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

