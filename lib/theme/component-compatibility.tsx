'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useThemeStyles } from './ThemeProvider';

/**
 * Theme-aware wrapper components that maintain compatibility with existing components
 * while enabling theme system integration
 */

interface ThemeCompatibleProps {
  children: React.ReactNode;
  className?: string;
  fallbackClassName?: string;
}

// Hero section wrapper with theme integration
export function ThemeHeroSection({ children, className, fallbackClassName }: ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'theme-gradient-hero' 
    : fallbackClassName || 'bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900';
  
  return (
    <section className={cn(themeClasses, 'text-white overflow-hidden', className)}>
      {children}
    </section>
  );
}

// Card wrapper with theme integration
export function ThemeCard({ children, className, fallbackClassName }: ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'bg-white/90 theme-backdrop-blur-sm theme-shadow-card theme-rounded-xl' 
    : fallbackClassName || 'bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl';
  
  return (
    <div className={cn(themeClasses, className)}>
      {children}
    </div>
  );
}

// Button wrapper with theme integration
export function ThemeButton({ 
  children, 
  className, 
  fallbackClassName,
  variant = 'primary',
  ...props 
}: ThemeCompatibleProps & { 
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) {
  const { isLoaded } = useThemeStyles();
  
  const getThemeClasses = () => {
    if (!isLoaded) {
      switch (variant) {
        case 'primary':
          return fallbackClassName || 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white';
        case 'secondary':
          return 'bg-white/10 border-2 theme-border-primary theme-text-primary hover:theme-bg-primary hover:text-white';
        case 'outline':
          return 'border-2 theme-border-primary theme-text-primary bg-white/10 hover:theme-bg-primary hover:text-white';
        default:
          return fallbackClassName || 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white';
      }
    }
    
    switch (variant) {
      case 'primary':
        return 'theme-gradient-button text-white hover:opacity-90';
      case 'secondary':
        return 'bg-white/10 border-2 theme-border-primary theme-text-primary hover:theme-bg-primary hover:text-white';
      case 'outline':
        return 'border-2 theme-border-primary theme-text-primary bg-white/10 hover:theme-bg-primary hover:text-white';
      default:
        return 'theme-gradient-button text-white hover:opacity-90';
    }
  };
  
  return (
    <button 
      className={cn(
        getThemeClasses(),
        'font-bold px-8 py-4 text-lg theme-shadow-button theme-rounded-lg transition-all duration-300 transform hover:scale-105',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Badge wrapper with theme integration
export function ThemeBadge({ children, className, fallbackClassName }: ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'bg-white/20 theme-backdrop-blur-sm border theme-border-primary theme-rounded-full' 
    : fallbackClassName || 'bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full';
  
  return (
    <div className={cn(themeClasses, 'px-4 py-2 text-sm font-semibold', className)}>
      {children}
    </div>
  );
}

// Gradient text wrapper
export function ThemeGradientText({ children, className }: ThemeCompatibleProps) {
  const { isLoaded, getPrimaryColor, getSecondaryColor } = useThemeStyles();
  
  if (isLoaded) {
    const primaryColor = getPrimaryColor('400');
    const secondaryColor = getSecondaryColor('600');
    
    return (
      <span 
        className={cn('bg-clip-text text-transparent', className)}
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
      >
        {children}
      </span>
    );
  }
  
  return (
    <span className={cn('bg-gradient-to-r from-emerald-400 to-teal-600 bg-clip-text text-transparent', className)}>
      {children}
    </span>
  );
}

// Stats card with theme integration
export function ThemeStatsCard({ 
  value, 
  label, 
  className, 
  fallbackClassName 
}: { 
  value: string; 
  label: string; 
} & ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'bg-white/10 theme-backdrop-blur-sm theme-rounded-xl' 
    : fallbackClassName || 'bg-white/10 backdrop-blur-sm rounded-xl';
  
  return (
    <div className={cn(themeClasses, 'text-center p-4', className)}>
      <div className="text-2xl sm:text-3xl font-bold theme-text-primary">{value}</div>
      <div className="text-xs sm:text-sm text-blue-200">{label}</div>
    </div>
  );
}

// Feature item with theme integration
export function ThemeFeatureItem({ 
  icon: Icon, 
  text, 
  className, 
  fallbackClassName 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  text: string; 
} & ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'bg-white/10 theme-backdrop-blur-sm theme-rounded-xl hover:bg-white/15' 
    : fallbackClassName || 'bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15';
  
  return (
    <div className={cn(themeClasses, 'flex items-center space-x-3 p-4 transition-all duration-200', className)}>
      <div className="theme-bg-primary/20 theme-rounded-xl p-2">
        <Icon className="h-5 w-5 theme-text-primary" />
      </div>
      <span className="text-sm font-medium text-blue-100">{text}</span>
    </div>
  );
}

// Contact card with theme integration
export function ThemeContactCard({ 
  icon: Icon, 
  title, 
  content, 
  className, 
  fallbackClassName 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  content: React.ReactNode; 
} & ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'bg-white/80 theme-backdrop-blur-sm theme-rounded-xl theme-shadow-card border theme-border-primary/20 hover:theme-shadow-hero' 
    : fallbackClassName || 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 hover:shadow-xl';
  
  return (
    <div className={cn(themeClasses, 'flex items-center space-x-4 p-6 transition-all duration-300', className)}>
      <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 theme-rounded-xl">
        <Icon className="h-7 w-7 theme-text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <div className="text-gray-600 hover:theme-text-primary transition-colors font-medium">
          {content}
        </div>
      </div>
    </div>
  );
}

// CTA section with theme integration
export function ThemeCTASection({ children, className, fallbackClassName }: ThemeCompatibleProps) {
  const { isLoaded } = useThemeStyles();
  
  const themeClasses = isLoaded 
    ? 'theme-gradient-button theme-rounded-xl' 
    : fallbackClassName || 'bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl';
  
  return (
    <div className={cn(themeClasses, 'p-8 sm:p-12 text-white relative overflow-hidden', className)}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}