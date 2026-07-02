import React from 'react'
import { clsx } from 'clsx'

export function Display({ children, className = '' }) {
  return (
    <h1 className={clsx('text-5xl md:text-6xl lg:text-8xl font-black leading-[1.05] tracking-tight text-white', className)}>
      {children}
    </h1>
  )
}

export function Heading1({ children, className = '' }) {
  return (
    <h1 className={clsx('text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white', className)}>
      {children}
    </h1>
  )
}

export function Heading2({ children, className = '' }) {
  return (
    <h2 className={clsx('text-2xl md:text-3xl font-bold leading-tight tracking-tight text-white', className)}>
      {children}
    </h2>
  )
}

export function Heading3({ children, className = '' }) {
  return (
    <h3 className={clsx('text-xl md:text-2xl font-semibold leading-snug tracking-tight text-white', className)}>
      {children}
    </h3>
  )
}

export function Heading4({ children, className = '' }) {
  return (
    <h4 className={clsx('text-lg font-semibold tracking-tight text-white', className)}>
      {children}
    </h4>
  )
}

export function Body({ children, className = '', muted = false }) {
  return (
    <p className={clsx('text-base leading-relaxed', muted ? 'text-text-secondary' : 'text-white/90', className)}>
      {children}
    </p>
  )
}

export function Small({ children, className = '', muted = true }) {
  return (
    <p className={clsx('text-sm leading-relaxed', muted ? 'text-text-secondary' : 'text-white/80', className)}>
      {children}
    </p>
  )
}

export function Caption({ children, className = '' }) {
  return (
    <p className={clsx('text-xs text-text-muted font-medium', className)}>
      {children}
    </p>
  )
}

export function Label({ children, className = '' }) {
  return (
    <span className={clsx('section-label', className)}>
      {children}
    </span>
  )
}

export function GoldText({ children, className = '' }) {
  return (
    <span className={clsx('text-gold-gradient', className)}>
      {children}
    </span>
  )
}
