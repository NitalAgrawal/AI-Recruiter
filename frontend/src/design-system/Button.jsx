import React from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

const sizes = {
  xs: 'px-3 py-1.5 text-xs gap-1.5 h-7',
  sm: 'px-4 py-2 text-sm gap-2 h-8',
  md: 'px-5 py-2.5 text-sm gap-2 h-9',
  lg: 'px-6 py-3 text-base gap-2.5 h-11',
  xl: 'px-7 py-3.5 text-base gap-3 h-12',
}

const variants = {
  primary: 'btn-primary',
  ghost:   'btn-ghost',
  outline: 'btn-outline',
  danger:  [
    'btn text-danger border font-semibold',
    'bg-danger/5 border-danger/20',
    'hover:bg-danger/12 hover:border-danger/40',
  ].join(' '),
  success: [
    'btn text-success border font-semibold',
    'bg-success/5 border-success/20',
    'hover:bg-success/12 hover:border-success/40',
  ].join(' '),
}

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  className = '',
  leftIcon,
  rightIcon,
  loading  = false,
  disabled = false,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      className={clsx(
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0 flex items-center">{leftIcon}</span>
      ) : null}
      <span className="tracking-tight">{children}</span>
      {rightIcon && !loading && (
        <span className="shrink-0 flex items-center">{rightIcon}</span>
      )}
    </button>
  )
}
