import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto' | 'footer';
}

export function Logo({ className = '', variant = 'auto' }: LogoProps) {
  return (
    <div className={`font-['Sansation',sans-serif] font-bold tracking-tight select-none ${className}`}>
      <span className="text-primary">R</span>
      <span className={`
        ${variant === 'light' ? 'text-black' : ''}
        ${variant === 'dark' || variant === 'footer' ? 'text-white' : ''}
        ${variant === 'auto' ? 'text-black dark:text-white' : ''}
      `}>
        even
      </span>
    </div>
  );
}
