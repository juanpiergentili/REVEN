import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto' | 'footer' | 'mono-white' | 'mono-black';
}

export function Logo({ className = '', variant = 'auto' }: LogoProps) {
  return (
    <div className={`font-['Sansation',sans-serif] font-bold tracking-tight select-none ${className}`}>
      <span className={
        variant === 'mono-white' ? 'text-white' : 
        variant === 'mono-black' ? 'text-black' : 
        'text-primary'
      }>R</span>
      <span className={`
        ${variant === 'light' || variant === 'mono-black' ? 'text-black' : ''}
        ${variant === 'dark' || variant === 'footer' || variant === 'mono-white' ? 'text-white' : ''}
        ${variant === 'auto' ? 'text-black dark:text-white' : ''}
      `}>
        even
      </span>
    </div>
  );
}
