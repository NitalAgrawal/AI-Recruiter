import React, { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    size = 'md',
    ...props
  },
  ref
) {
  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
  }

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gold transition-colors">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            'input-base',
            sizes[size],
            leftIcon  && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-danger focus:border-danger focus:ring-danger/30 focus:shadow-none',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger flex items-center gap-1"><span className="w-1 h-1 bg-danger rounded-full" />{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
    </div>
  )
})

export default Input

// ─── Select ─────────────────────────────────────────────
export function Select({ label, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'input-base appearance-none cursor-pointer pr-10',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// ─── Textarea ───────────────────────────────────────────
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={clsx(
          'input-base resize-none',
          error && 'border-danger focus:border-danger focus:ring-danger/30 focus:shadow-none',
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger flex items-center gap-1"><span className="w-1 h-1 bg-danger rounded-full" />{error}</p>}
    </div>
  )
}
