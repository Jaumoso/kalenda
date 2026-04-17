import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'

interface UserRow {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

interface CreateUserForm {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'USER'
}

export default function AdminPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    name: '',
    password: '',
    role: 'USER',
  })
  const [createError, setCreateError] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { data } = await api.get('/users')
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    try {
      await api.post('/users', createForm)

      setShowCreateForm(false)
      setCreateForm({ email: '', name: '', password: '', role: 'USER' })
      await fetchUsers()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setCreateError(axiosErr.response?.data?.message || t('admin.errorCreating'))
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${userId}/status`, { active: !isActive })
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.errorUpdating'))
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'ADMIN' | 'USER') => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole })
      setEditingUser(null)
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.errorUpdating'))
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(t('admin.confirmDelete', { name: userName }))) return

    try {
      await api.delete(`/users/${userId}`)
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.errorDeleting'))
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">CalendApp</h1>
            <p className="text-sm text-neutral-500">{t('admin.title')}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600">{currentUser?.name}</span>
            <a href="/" className="text-sm text-primary-600 hover:text-primary-700">
              {t('admin.backToDashboard')}
            </a>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-800">{t('admin.users')}</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {t('admin.createUser')}
          </button>
        </div>

        {/* Create user form */}
        {showCreateForm && (
          <div className="mb-6 bg-surface rounded-lg shadow p-6 border border-neutral-200">
            <h3 className="text-md font-semibold text-neutral-800 mb-4">{t('admin.newUser')}</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('admin.name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('admin.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('admin.password')}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {t('admin.role')}
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        role: e.target.value as 'ADMIN' | 'USER',
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="USER">{t('admin.roleUser')}</option>
                    <option value="ADMIN">{t('admin.roleAdmin')}</option>
                  </select>
                </div>
              </div>

              {createError && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{createError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
                >
                  {t('admin.create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateError('')
                  }}
                  className="px-4 py-2 bg-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-300"
                >
                  {t('admin.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-neutral-500">{t('admin.loading')}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-lg shadow overflow-hidden border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('admin.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('admin.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('admin.role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('admin.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-neutral-200">
                {users.map((u) => (
                  <tr key={u.id} className={!u.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingUser === u.id ? (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeRole(u.id, e.target.value as 'ADMIN' | 'USER')
                          }
                          onBlur={() => setEditingUser(null)}
                          autoFocus
                          className="px-2 py-1 border border-neutral-300 rounded text-sm"
                        >
                          <option value="USER">{t('admin.roleUser')}</option>
                          <option value="ADMIN">{t('admin.roleAdmin')}</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => u.id !== currentUser?.id && setEditingUser(u.id)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 bg-transparent ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          } ${u.id !== currentUser?.id ? 'cursor-pointer hover:opacity-80' : ''}`}
                        >
                          {u.role === 'ADMIN' ? t('admin.roleAdmin') : t('admin.roleUser')}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.isActive ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {u.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            className="text-neutral-600 hover:text-neutral-900"
                          >
                            {u.isActive ? t('admin.deactivate') : t('admin.activate')}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="text-red-600 hover:text-red-800"
                          >
                            {t('admin.delete')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-neutral-500 text-sm">{t('admin.noUsers')}</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
