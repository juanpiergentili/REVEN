import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export function Logo({ className = '', variant = 'auto' }: LogoProps) {
  return (
    <div className={`font-logo font-bold tracking-tight select-none ${className}`}>
      <span className="text-primary">R</span>
      <span className={`
        ${variant === 'light' ? 'text-white' : ''}
        ${variant === 'dark' ? 'text-black' : ''}
        ${variant === 'auto' ? 'text-foreground' : ''}
      `}>
        EVEN
      </span>
    </div>
  );
}
