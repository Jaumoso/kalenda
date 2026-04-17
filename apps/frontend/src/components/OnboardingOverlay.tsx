import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Hand, Calendar, Image, Paintbrush, FileDown } from 'lucide-react'

const ONBOARDING_KEY = 'calendapp-onboarding-done'

export default function OnboardingOverlay() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const steps = [
    {
      icon: <Hand size={32} />,
      title: t('onboarding.welcome'),
      text: t('onboarding.welcomeText'),
    },
    {
      icon: <Calendar size={32} />,
      title: t('onboarding.createProject'),
      text: t('onboarding.createProjectText'),
    },
    {
      icon: <Image size={32} />,
      title: t('onboarding.uploadPhotos'),
      text: t('onboarding.uploadPhotosText'),
    },
    {
      icon: <Paintbrush size={32} />,
      title: t('onboarding.designPages'),
      text: t('onboarding.designPagesText'),
    },
    {
      icon: <FileDown size={32} />,
      title: t('onboarding.exportPrint'),
      text: t('onboarding.exportPrintText'),
    },
  ]

  const current = steps[step]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9990]">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">{current.icon}</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{current.title}</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">{current.text}</p>
        </div>

        {/* Progress dots */}
        {/* eslint-disable-next-line react/no-array-index-key */}
        <div className="flex justify-center gap-1.5 pb-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-primary-600' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <button onClick={dismiss} className="text-xs text-neutral-400 hover:text-neutral-600">
            {t('onboarding.skip')}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="btn btn-secondary text-sm">
                {t('onboarding.previous')}
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary text-sm">
                {t('onboarding.next')}
              </button>
            ) : (
              <button onClick={dismiss} className="btn btn-primary text-sm">
                {t('onboarding.getStarted')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
