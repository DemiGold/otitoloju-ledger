import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Search, 
  UserPlus, 
  PlusCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Loader2,
  Users
} from 'lucide-react'
import { TransactionModal } from '../components/TransactionModal'

export const Dashboard = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  
  const { adminProfile, isSuperAdmin } = useAuth()

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMembers(data)
    }
    setLoading(false)
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      // Generate a unique member code
      const code = `MEM-${Date.now().toString().slice(-6)}`
      
      const { data, error } = await supabase
        .from('members')
        .insert([{
          name: newMemberName,
          phone: newMemberPhone,
          member_code: code,
          status: 'PENDING'
        }])
        .select()

      if (error) throw error

      setMessage({ type: 'success', text: 'Member added successfully! Waiting for Super Admin approval.' })
      setNewMemberName('')
      setNewMemberPhone('')
      await fetchMembers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveMember = async (memberId) => {
    const { error } = await supabase
      .from('members')
      .update({ status: 'APPROVED' })
      .eq('id', memberId)

    if (!error) {
      await fetchMembers()
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone && member.phone.includes(searchTerm)) ||
    (member.member_code && member.member_code.includes(searchTerm))
  )

  const pendingMembers = filteredMembers.filter(m => m.status === 'PENDING')
  const approvedMembers = filteredMembers.filter(m => m.status === 'APPROVED')

  return (
    <div>
      {/* Header with stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {members.filter(m => m.status === 'PENDING').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'APPROVED').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search members by name, phone, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add Member
        </button>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowAddMember(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Add New Member
                </h3>
                <form onSubmit={handleAddMember}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>⚠️ New members will be marked as <span className="font-medium text-yellow-600">PENDING</span> until approved by a Super Admin.</p>
                    </div>
                    {message && (
                      <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.text}
                      </div>
                    )}
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredMembers.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No members found
              </li>
            ) : (
              <>
                {/* Pending Members Section */}
                {pendingMembers.length > 0 && (
                  <li className="px-6 py-3 bg-yellow-50">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Pending Approval ({pendingMembers.length})
                    </h3>
                  </li>
                )}
                {pendingMembers.map(member => (
                  <MemberListItem
                    key={member.id}
                    member={member}
                    isSuperAdmin={isSuperAdmin}
                    onApprove={handleApproveMember}
                    onSelectMember={setSelectedMember}
                    onOpenTransaction={setShowTransactionModal}
                  />
                ))}
                
                {/* Approved Members Section */}
                {approvedMembers.length > 0 && pendingMembers.length > 0 && (
                  <li className="px-6 py-3 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-600">
                      Approved Members ({approvedMembers.length})
                    </h3>
                  </li>
                )}
                {approvedMembers.map(member => (
                  <MemberListItem
                    key={member.id}
                    member={member}
                    isSuperAdmin={isSuperAdmin}
                    onApprove={handleApproveMember}
                    onSelectMember={setSelectedMember}
                    onOpenTransaction={setShowTransactionModal}
                  />
                ))}
              </>
            )}
          </ul>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setSelectedMember(null)
        }}
        member={selectedMember}
        adminId={adminProfile?.id}
        onSuccess={fetchMembers}
      />
    </div>
  )
}

// Member List Item Component
const MemberListItem = ({ member, isSuperAdmin, onApprove, onSelectMember, onOpenTransaction }) => {
  const isPending = member.status === 'PENDING'

  return (
    <li className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <p className="text-sm font-medium text-gray-900">
              {member.name}
            </p>
            {isPending ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Approved
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <span>{member.member_code}</span>
            {member.phone && <span>📱 {member.phone}</span>}
            <span>Added: {new Date(member.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isPending && isSuperAdmin && (
            <button
              onClick={() => onApprove(member.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </button>
          )}
          {!isPending && (
            <>
              <button
                onClick={() => {
                  onSelectMember(member)
                  onOpenTransaction(true)
                }}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Transaction
              </button>
              <Link
                to={`/member/${member.id}`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </li>
  )
}