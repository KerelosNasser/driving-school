'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { applyThemeToDocument, validateThemeVariables, getCurrentThemeValues } from './theme-integration';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    accent: Record<string, string>;
    neutral: Record<string, string>;
  };
  gradients: Record<string, any>;
  effects: {
    backdropBlur: Record<string, string>;
    boxShadow: Record<string, string>;
    borderRadius: Record<string, string>;
  };
  typography: {
    fontFamily: Record<string, string[]>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
}

interface ThemeContextType {
  currentTheme: Theme | null;
  applyTheme: (theme: Theme) => void;
  resetTheme: () => void;
  isThemeLoaded: boolean;
  themeVariables: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme || null);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [themeVariables, setThemeVariables] = useState<Record<string, string>>({});

  // Initialize theme system
  useEffect(() => {
    const initializeTheme = () => {
      // Validate that theme variables are loaded
      const isValid = validateThemeVariables();
      setIsThemeLoaded(isValid);
      
      if (isValid) {
        // Get current theme values
        const variables = getCurrentThemeValues();
        setThemeVariables(variables);
        
        console.log('Theme system initialized successfully');
      } else {
        console.warn('Theme variables not properly loaded');
      }
    };

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
      initializeTheme();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', initializeTheme);
    };
  }, []);

  const applyTheme = (theme: Theme) => {
    try {
      applyThemeToDocument(theme);
      setCurrentTheme(theme);
      
      // Update theme variables state
      const updatedVariables = getCurrentThemeValues();
      setThemeVariables(updatedVariables);
      
      console.log(`Applied theme: ${theme.name}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const resetTheme = () => {
    try {
      // Reset to default by removing custom properties
      const root = document.documentElement;
      Object.keys(themeVariables).forEach(prop => {
        root.style.removeProperty(prop);
      });
      
      setCurrentTheme(null);
      
      // Get default theme variables
      const defaultVariables = getCurrentThemeValues();
      setThemeVariables(defaultVariables);
      
      console.log('Reset to default theme');
    } catch (error) {
      console.error('Failed to reset theme:', error);
    }
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    applyTheme,
    resetTheme,
    isThemeLoaded,
    themeVariables,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for theme-aware component styling
export function useThemeStyles() {
  const { themeVariables, isThemeLoaded } = useTheme();
  
  return {
    isLoaded: isThemeLoaded,
    variables: themeVariables,
    
    // Helper functions for common theme values
    getPrimaryColor: (shade: string = '500') => 
      themeVariables[`--theme-primary-${shade}`] || '',
    
    getSecondaryColor: (shade: string = '500') => 
      themeVariables[`--theme-secondary-${shade}`] || '',
    
    getGradient: (name: string) => 
      themeVariables[`--theme-gradient-${name}`] || '',
    
    getShadow: (name: string) => 
      themeVariables[`--theme-shadow-${name}`] || '',
    
    getRadius: (size: string) => 
      themeVariables[`--theme-radius-${size}`] || '',
  };
}