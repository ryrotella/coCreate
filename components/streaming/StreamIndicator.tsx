'use client'

interface StreamIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function StreamIndicator({
  size = 'md',
  showText = true,
  className = '',
}: StreamIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="relative flex">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${sizeClasses[size]}`}
        />
        <span
          className={`relative inline-flex rounded-full bg-red-500 ${sizeClasses[size]}`}
        />
      </span>
      {showText && (
        <span
          className={`font-bold text-red-500 uppercase tracking-wider ${textSizeClasses[size]}`}
        >
          LIVE
        </span>
      )}
    </div>
  )
}
