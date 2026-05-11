import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto' | 'footer' | 'mono-white' | 'mono-black' | 'giant';
  outline?: boolean;
}

export function Logo({ className = '', variant = 'auto', outline = false }: LogoProps) {
  // LIME GREEN: #d4ef06
  
  const getRColor = () => {
    if (variant === 'mono-white') return 'text-white';
    if (variant === 'mono-black') return 'text-black';
    if (variant === 'auto') return 'text-black dark:text-[#d4ef06]';
    return 'text-[#d4ef06]';
  };

  const getEvenColor = () => {
    if (variant === 'light' || variant === 'mono-black') return 'text-black';
    if (variant === 'dark' || variant === 'footer' || variant === 'mono-white' || variant === 'giant') return 'text-white';
    return 'text-black dark:text-white';
  };

  const isGiant = variant === 'giant';
  
  const outlineStyles = outline ? {
    WebkitTextStroke: isGiant ? '2px currentColor' : '1px currentColor',
    color: 'transparent'
  } : {};

  return (
    <div className={`font-['Sansation',sans-serif] font-normal tracking-tight select-none flex items-baseline ${className} ${isGiant ? 'text-[28vw] leading-none' : ''}`}>
      <span 
        className={getRColor()} 
        style={outline ? { ...outlineStyles, WebkitTextStroke: isGiant ? '3px #d4ef06' : '1px #d4ef06' } : {}}
      >
        R
      </span>
      <span 
        className={getEvenColor()}
        style={outline ? { ...outlineStyles, WebkitTextStroke: isGiant ? '3px white' : '1px currentColor' } : {}}
      >
        even
      </span>
    </div>
  );
}
