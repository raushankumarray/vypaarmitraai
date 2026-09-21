'use client';

import React from 'react';

interface BrandNameProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  theme?: 'dark' | 'light';
  showAi?: boolean;
  className?: string;
}

/**
 * Renders the official VypaarMitra AI brand name with exact logo colors:
 * - "Vypaar" in electric royal blue (#0062ff)
 * - "Mitra" in rich vibrant green (#00a651)
 * - "AI" in a rounded gradient badge (royal blue to purple)
 */
export function BrandName({
  size = 'md',
  theme = 'light',
  showAi = true,
  className = '',
}: BrandNameProps) {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl',
  };

  const aiSizes = {
    xs: 'text-[8px] px-1 py-0.2 rounded',
    sm: 'text-[9px] px-1.5 py-0.2 rounded-md',
    md: 'text-[10px] px-1.5 py-0.5 rounded-md',
    lg: 'text-xs px-2 py-0.5 rounded-lg',
    xl: 'text-xs px-2 py-0.5 rounded-lg',
    '2xl': 'text-sm px-2.5 py-0.5 rounded-xl ml-1',
    '3xl': 'text-base px-3 py-1 rounded-xl ml-1.5',
  };

  const isDark = theme === 'dark';

  // On dark backgrounds we use slightly brighter luminance for readability
  const vypaarColor = isDark ? 'text-[#38bdf8]' : 'text-[#0062ff]';
  const mitraColor = isDark ? 'text-[#4ade80]' : 'text-[#00a651]';

  return (
    <span className={`inline-flex items-center gap-1 font-black tracking-tight select-none ${textSizes[size]} ${className}`}>
      <span className="inline-flex items-baseline">
        <span className={`${vypaarColor} font-black transition-colors`}>Vypaar</span>
        <span className={`${mitraColor} font-black transition-colors`}>Mitra</span>
      </span>
      {showAi && (
        <span
          className={`inline-block font-black tracking-wider text-white bg-gradient-to-r from-[#0062ff] via-[#4f46e5] to-[#7c3aed] shadow-xs ${aiSizes[size]}`}
        >
          AI
        </span>
      )}
    </span>
  );
}

export default BrandName;
