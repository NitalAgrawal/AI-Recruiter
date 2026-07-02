import React from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover     = false,
  padding   = true,
  goldBorder = false,
  animate   = false,
  onClick,
}) {
  const Tag = animate ? motion.div : 'div'
  const animProps = animate ? {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.22,1,0.36,1] },
  } : {}

  return (
    <Tag
      onClick={onClick}
      {...animProps}
      className={clsx(
        hover ? 'glass-card-hover' : 'glass-card',
        padding && 'p-6',
        goldBorder && 'border-gold/15 shadow-gold-sm',
        (onClick && !hover) && 'cursor-pointer',
        className
      )}
    >
      {/* Top edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rounded-t-[inherit]" />
      {children}
    </Tag>
  )
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('flex items-center justify-between mb-5', className)}>
      {children}
    </div>
  )
}

Card.Title = function CardTitle({ children, className = '' }) {
  return (
    <div>
      <span className={clsx('section-label', className)}>{children}</span>
    </div>
  )
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={clsx('', className)}>{children}</div>
}

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('mt-5 pt-4 flex items-center justify-between', className)}
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {children}
    </div>
  )
}
