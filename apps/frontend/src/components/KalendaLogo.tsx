interface Props {
  size?: number
  className?: string
}

export default function KalendaLogo({ size = 32, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kalenda"
    >
      {/* Calendar body */}
      <rect x="6" y="14" width="52" height="44" rx="6" fill="currentColor" opacity="0.1" />
      <rect x="6" y="14" width="52" height="44" rx="6" stroke="currentColor" strokeWidth="3" />

      {/* Top bar */}
      <rect x="6" y="14" width="52" height="14" rx="6" fill="currentColor" />
      <rect x="6" y="22" width="52" height="6" fill="currentColor" />

      {/* Rings */}
      <rect x="20" y="8" width="4" height="14" rx="2" fill="currentColor" />
      <rect x="40" y="8" width="4" height="14" rx="2" fill="currentColor" />

      {/* Letter K */}
      <path
        d="M24 36V52M24 44L34 36M28 44L36 52"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dot */}
      <circle cx="42" cy="51" r="2.5" fill="currentColor" />
    </svg>
  )
}
