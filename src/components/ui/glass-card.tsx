import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'modal' | 'badge' | 'button'
  hover?: boolean
  animate?: boolean
}

const variants = {
  default: 'glass-card',
  modal: 'glass-modal',
  badge: 'glass-badge',
  button: 'glass-button'
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default', 
  hover = true,
  animate = true,
  ...props 
}: GlassCardProps) {
  const Component = animate ? motion.div : 'div'
  
  const motionProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
    whileHover: hover ? { 
      y: -4, 
      scale: 1.02,
      transition: { duration: 0.2 }
    } : undefined
  } : {}

  return (
    <Component
      className={cn(
        variants[variant],
        hover && 'hover-lift cursor-pointer',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
}