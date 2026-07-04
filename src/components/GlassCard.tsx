import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  id?: string;
  key?: any;
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  animate?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({
  id,
  children,
  className = '',
  hoverEffect = false,
  animate = true,
  delay = 0,
  onClick
}: GlassCardProps) {
  const cardContent = (
    <div
      id={id}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/65 dark:bg-white/5 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-black/40 ${
        hoverEffect ? 'hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
      
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );

  if (!animate) {
    return cardContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      whileHover={hoverEffect ? { y: -4 } : undefined}
      className="h-full w-full"
    >
      {cardContent}
    </motion.div>
  );
}
