import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'

interface ProfileForm {
  name: string
  language: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? '',
    language: user?.language ?? i18n.language.slice(0, 2),
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm((previous) => ({
        ...previous,
        name: user.name,
        language: user.language ?? i18n.language.slice(0, 2),
      }))
    }
  }, [user, i18n.language])

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!user) return
    if (form.name.trim().length < 2) {
      setError(t('profile.nameMinLength'))
      return
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError(t('profile.passwordsDoNotMatch'))
      return
    }
    if (form.newPassword && !form.currentPassword) {
      setError(t('profile.currentPasswordRequired'))
      return
    }

    setIsSaving(true)
    try {
      const payload: {
        name: string
        language: string
        currentPassword?: string
        newPassword?: string
      } = {
        name: form.name.trim(),
        language: form.language,
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }

      const { data } = await api.patch(`/users/${user.id}`, payload)
      updateUser(data.user)
      await i18n.changeLanguage(form.language)
      setForm((previous) => ({
        ...previous,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setMessage(t('profile.saved'))
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || t('profile.errorSaving'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-neutral-200 bg-surface p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t('profile.description')}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-neutral-700">
                {t('profile.name')}
              </label>
              <input
                id="profile-name"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-neutral-700">
                {t('profile.email')}
              </label>
              <input
                id="profile-email"
                value={user?.email ?? ''}
                disabled
                className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-500"
              />
            </div>

            <div>
              <label
                htmlFor="profile-language"
                className="block text-sm font-medium text-neutral-700"
              >
                {t('profile.language')}
              </label>
              <select
                id="profile-language"
                value={form.language}
                onChange={(event) => handleChange('language', event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="es">{t('language.es')}</option>
                <option value="en">{t('language.en')}</option>
              </select>
            </div>

            <div className="border-t border-neutral-200 pt-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('profile.changePassword')}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t('profile.changePasswordDescription')}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-neutral-700"
                  >
                    {t('profile.currentPassword')}
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={form.currentPassword}
                    onChange={(event) => handleChange('currentPassword', event.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-neutral-700"
                  >
                    {t('profile.newPassword')}
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={form.newPassword}
                    onChange={(event) => handleChange('newPassword', event.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="block text-sm font-medium text-neutral-700"
                  >
                    {t('profile.confirmPassword')}
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => handleChange('confirmPassword', event.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {(error || message) && (
              <div
                className={`rounded-md p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
              >
                {error || message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
