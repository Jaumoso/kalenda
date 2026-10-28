import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import KalendaLogo from '../components/KalendaLogo'
import api from '../lib/api'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  useEffect(() => {
    api
      .get<{ enabled: boolean }>('/auth/registration-status')
      .then(({ data }) => setIsEnabled(data.enabled))
      .catch(() => setIsEnabled(false))
  }, [])

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    setIsSubmitting(true)
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || t('auth.registrationFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <KalendaLogo size={48} className="text-primary-600" />
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">Kalenda</h1>
          <p className="mt-2 text-center text-sm text-neutral-600">{t('auth.createAccount')}</p>
        </div>

        {isEnabled === null ? (
          <p className="text-center text-sm text-neutral-600">{t('auth.checkingRegistration')}</p>
        ) : !isEnabled ? (
          <div className="space-y-4 text-center">
            <p className="rounded-md bg-neutral-100 p-4 text-sm text-neutral-700">
              {t('auth.registrationDisabled')}
            </p>
            <Link
              to="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                {t('auth.name')}
              </label>
              <input
                {...register('name', {
                  required: t('auth.nameRequired'),
                  minLength: { value: 2, message: t('auth.nameMinLength') },
                })}
                id="name"
                type="text"
                autoComplete="name"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                {t('auth.email')}
              </label>
              <input
                {...register('email', {
                  required: t('auth.emailRequired'),
                  pattern: { value: /^\S+@\S+$/i, message: t('auth.invalidEmail') },
                })}
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                {t('auth.password')}
              </label>
              <input
                {...register('password', {
                  required: t('auth.passwordRequired'),
                  minLength: { value: 6, message: t('auth.passwordMinLength') },
                })}
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-neutral-700"
              >
                {t('auth.confirmPassword')}
              </label>
              <input
                {...register('confirmPassword', {
                  required: t('auth.confirmPasswordRequired'),
                  validate: (value) => value === watch('password') || t('auth.passwordsDoNotMatch'),
                })}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {(errors.name ||
              errors.email ||
              errors.password ||
              errors.confirmPassword ||
              error) && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error ||
                  errors.name?.message ||
                  errors.email?.message ||
                  errors.password?.message ||
                  errors.confirmPassword?.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
            </button>
            <p className="text-center text-sm text-neutral-600">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
