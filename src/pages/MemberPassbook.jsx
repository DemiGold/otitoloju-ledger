import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react'

export const MemberPassbook = () => {
  const { id } = useParams()
  const [member, setMember] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const printRef = useRef()

  useEffect(() => {
    fetchMemberData()
  }, [id])

  const fetchMemberData = async () => {
    setLoading(true)
    try {
      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          admins (email)
        `)
        .eq('member_id', id)
        .order('created_at', { ascending: false })

      if (transactionError) throw transactionError
      setTransactions(transactionData || [])

      // Calculate balance
      let total = 0
      transactionData?.forEach(t => {
        if (t.type === 'DEPOSIT') total += parseFloat(t.amount)
        else total -= parseFloat(t.amount)
      })
      setBalance(total)
    } catch (error) {
      console.error('Error fetching member data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Member not found</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Member Passbook</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="w-5 h-5 mr-2" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="print-page">
        {/* Member Info Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Member Name</p>
              <p className="text-lg font-semibold">{member.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Member Code</p>
              <p className="text-lg font-semibold">{member.member_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-lg font-semibold">{member.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Current Balance</p>
              <p className="text-3xl font-bold">₦{balance.toFixed(2)}</p>
            </div>
            <Wallet className="w-12 h-12 opacity-50" />
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === 'DEPOSIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.type === 'DEPOSIT' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={t.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}>
                          {t.type === 'DEPOSIT' ? '+' : '-'}₦{parseFloat(t.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.admins?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {t.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer for printing */}
        <div className="mt-8 text-center text-sm text-gray-500 print:block hidden">
          <p>Generated on {new Date().toLocaleString()}</p>
          <p className="font-medium text-gray-700">Otitoloju Cooperative Society</p>
        </div>
      </div>
    </div>
  )
}


