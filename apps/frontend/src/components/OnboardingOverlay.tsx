import { useState, useEffect } from 'react'

const ONBOARDING_KEY = 'calendapp-onboarding-done'

export default function OnboardingOverlay() {
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
      icon: '👋',
      title: 'Welcome to CalendApp!',
      text: 'Create custom calendars with your own photos and designs, ready to print.',
    },
    {
      icon: '📅',
      title: 'Create a project',
      text: 'From "My calendars", create a new project. Each project includes 12 months with front and back covers.',
    },
    {
      icon: '🖼️',
      title: 'Upload your photos',
      text: 'Go to "Library" to upload images and stickers. You can use them in any month.',
    },
    {
      icon: '🎨',
      title: 'Design each page',
      text: 'In the editor, add images, text, and stickers on an A4 canvas. Customize colors, fonts, and the calendar grid.',
    },
    {
      icon: '📄',
      title: 'Export and print',
      text: 'When you are done, export a high-quality PDF and print it.',
    },
  ]

  const current = steps[step]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9990]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-8 text-center">
          <span className="text-5xl block mb-4">{current.icon}</span>
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
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="btn btn-secondary text-sm">
                Previous
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary text-sm">
                Next
              </button>
            ) : (
              <button onClick={dismiss} className="btn btn-primary text-sm">
                Get started!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
