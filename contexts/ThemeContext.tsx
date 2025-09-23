'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    destructive: string;
    border: string;
    ring: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    lineHeight: number;
    letterSpacing: number;
  };
  layout: {
    containerMaxWidth: string;
    borderRadius: number;
    spacing: number;
    headerHeight: number;
    footerHeight: number;
    sidebarWidth: number;
  };
  darkMode: boolean;
  customCss: string;
}

interface ThemeContextType {
  theme: ThemeConfig | null;
  updateTheme: (newTheme: ThemeConfig) => void;
  applyTheme: (theme: ThemeConfig) => void;
}

const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#EDE513',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    foreground: '#020817',
    muted: '#f1f5f9',
    destructive: '#ef4444',
    border: '#e2e8f0',
    ring: '#EDE513'
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    headingFontFamily: 'Inter, sans-serif',
    lineHeight: 1.5,
    letterSpacing: 0
  },
  layout: {
    containerMaxWidth: '1200px',
    borderRadius: 8,
    spacing: 16,
    headerHeight: 80,
    footerHeight: 120,
    sidebarWidth: 280
  },
  darkMode: false,
  customCss: ''
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  // Load theme from API on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/admin/theme');
        if (response.ok) {
          const { data } = await response.json();
          setTheme(data);
          applyTheme(data);
        } else {
          // Use default theme if API fails
          setTheme(defaultTheme);
          applyTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setTheme(defaultTheme);
        applyTheme(defaultTheme);
      }
    };

    loadTheme();
  }, []);

  // Re-fetch theme when an admin applies a theme to live site
  useEffect(() => {
    const handler = async () => {
      try {
        const response = await fetch('/api/admin/theme');
        if (response.ok) {
          const { data } = await response.json();
          setTheme(data);
          applyTheme(data);
        }
      } catch (err) {
        // non-fatal
        console.warn('Failed to reload theme after live apply:', err);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('themeAppliedToLive', handler as EventListener);
      return () => window.removeEventListener('themeAppliedToLive', handler as EventListener);
    }
  }, []);

  // Apply theme to document
  const applyTheme = (themeConfig: ThemeConfig) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Convert hex to HSL for better color manipulation
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      const add = max + min;
      const l = add * 0.5;
      
      let s, h;
      if (diff === 0) {
        s = h = 0;
      } else {
        s = l < 0.5 ? diff / add : diff / (2 - add);
        switch (max) {
          case r: h = ((g - b) / diff) + (g < b ? 6 : 0); break;
          case g: h = (b - r) / diff + 2; break;
          case b: h = (r - g) / diff + 4; break;
          default: h = 0;
        }
        h /= 6;
      }
      
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    };
    
    // Apply CSS custom properties
    const primary = hexToHsl(themeConfig.colors.primary);
    const secondary = hexToHsl(themeConfig.colors.secondary);
    
    // Set theme variables as HSL for better manipulation
    root.style.setProperty('--theme-primary-h', primary.h.toString());
    root.style.setProperty('--theme-primary-s', primary.s + '%');
    root.style.setProperty('--theme-primary-l', primary.l + '%');
    root.style.setProperty('--theme-secondary-h', secondary.h.toString());
    root.style.setProperty('--theme-secondary-s', secondary.s + '%');
    root.style.setProperty('--theme-secondary-l', secondary.l + '%');
    
    // Apply typography variables
    root.style.setProperty('--font-family', themeConfig.typography.fontFamily);
    root.style.setProperty('--heading-font-family', themeConfig.typography.headingFontFamily);
    
    // Apply layout variables
    root.style.setProperty('--container-max-width', themeConfig.layout.containerMaxWidth);
    root.style.setProperty('--radius', `${themeConfig.layout.borderRadius}px`);
    
    // Apply dark mode
    if (themeConfig.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Create comprehensive theme overrides
    let customStyleElement = document.getElementById('custom-theme-styles');
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'custom-theme-styles';
      document.head.appendChild(customStyleElement);
    }
    
    // Override all hardcoded yellow and blue classes with theme colors
    const themeOverrides = `
      /* Primary color overrides (yellow variants) */
      .bg-yellow-50 { background-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.3) calc(var(--theme-primary-l) + 45%)) !important; }
      .bg-yellow-100 { background-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.5) calc(var(--theme-primary-l) + 40%)) !important; }
      .bg-yellow-500 { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) var(--theme-primary-l)) !important; }
      .bg-yellow-600 { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 10%)) !important; }
      .bg-yellow-700 { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important; }
      .bg-yellow-800 { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 30%)) !important; }
      .bg-yellow-900 { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 40%)) !important; }
      
      .text-yellow-100 { color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.5) calc(var(--theme-primary-l) + 40%)) !important; }
      .text-yellow-500 { color: hsl(var(--theme-primary-h) var(--theme-primary-s) var(--theme-primary-l)) !important; }
      .text-yellow-600 { color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 10%)) !important; }
      .text-yellow-700 { color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important; }
      .text-yellow-800 { color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 30%)) !important; }
      .text-yellow-900 { color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 40%)) !important; }
      
      .border-yellow-200 { border-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.7) calc(var(--theme-primary-l) + 30%)) !important; }
      .border-yellow-300 { border-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.8) calc(var(--theme-primary-l) + 20%)) !important; }
      .border-yellow-500 { border-color: hsl(var(--theme-primary-h) var(--theme-primary-s) var(--theme-primary-l)) !important; }
      
      .fill-yellow-500 { fill: hsl(var(--theme-primary-h) var(--theme-primary-s) var(--theme-primary-l)) !important; }
      
      /* Hover states */
      .hover\\:bg-yellow-600:hover { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 10%)) !important; }
      .hover\\:bg-yellow-700:hover { background-color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important; }
      .hover\\:text-yellow-600:hover { color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 10%)) !important; }
      .hover\\:text-yellow-700:hover { color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important; }
      .hover\\:bg-yellow-50:hover { background-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.3) calc(var(--theme-primary-l) + 45%)) !important; }
      
      /* Secondary color overrides (blue variants) */
      .bg-blue-50 { background-color: hsl(var(--theme-secondary-h) calc(var(--theme-secondary-s) * 0.3) calc(var(--theme-secondary-l) + 45%)) !important; }
      .bg-blue-600 { background-color: hsl(var(--theme-secondary-h) var(--theme-secondary-s) calc(var(--theme-secondary-l) - 10%)) !important; }
      .text-blue-600 { color: hsl(var(--theme-secondary-h) var(--theme-secondary-s) calc(var(--theme-secondary-l) - 10%)) !important; }
      .text-blue-700 { color: hsl(var(--theme-secondary-h) var(--theme-secondary-s) calc(var(--theme-secondary-l) - 20%)) !important; }
      .border-blue-200 { border-color: hsl(var(--theme-secondary-h) calc(var(--theme-secondary-s) * 0.7) calc(var(--theme-secondary-l) + 30%)) !important; }
      .hover\\:text-blue-700:hover { color: hsl(var(--theme-secondary-h) var(--theme-secondary-s) calc(var(--theme-secondary-l) - 20%)) !important; }
      
      /* Gradient overrides */
      .bg-gradient-to-r.from-yellow-900.to-yellow-700 { 
        background: linear-gradient(to right, 
          hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 40%)), 
          hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%))
        ) !important; 
      }
      .bg-gradient-to-t.from-yellow-900\\/60.to-transparent { 
        background: linear-gradient(to top, 
          hsla(var(--theme-primary-h), var(--theme-primary-s), calc(var(--theme-primary-l) - 40%), 0.6), 
          transparent
        ) !important; 
      }
      .from-yellow-900 { --tw-gradient-from: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 40%)) !important; }
      .to-yellow-700 { --tw-gradient-to: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important; }
      
      /* Typography overrides - preserve white/black text for contrast */
      .text-black { color: ${themeConfig.colors.foreground} !important; }
      .text-white { color: ${themeConfig.colors.background === '#ffffff' ? '#ffffff' : themeConfig.colors.background} !important; }
      
      /* Background overrides for better theme integration */
      .bg-white\\/90 { background-color: hsla(from ${themeConfig.colors.background} h s l / 0.9) !important; }
      .backdrop-blur-sm { backdrop-filter: blur(8px) !important; }
      
      /* Animation and spinner colors */
      .border-blue-600 { border-color: hsl(var(--theme-secondary-h) var(--theme-secondary-s) calc(var(--theme-secondary-l) - 10%)) !important; }
      .border-b-2.border-blue-600 { border-bottom-color: hsl(var(--theme-secondary-h) var(--theme-secondary-s) calc(var(--theme-secondary-l) - 10%)) !important; }
      
      /* Status and accent colors */
      .text-green-600 { color: #059669 !important; }
      .text-red-600 { color: #dc2626 !important; }
      .text-amber-600 { color: #d97706 !important; }
      
      /* Specific component overrides */
      .bg-yellow-100.text-yellow-600 { 
        background-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.5) calc(var(--theme-primary-l) + 40%)) !important;
        color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 10%)) !important;
      }
      .bg-yellow-200.text-yellow-700,
      .bg-yellow-200.text-yellow-800 { 
        background-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.7) calc(var(--theme-primary-l) + 30%)) !important;
        color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important;
      }
      .border-yellow-300.text-yellow-700 { 
        border-color: hsl(var(--theme-primary-h) calc(var(--theme-primary-s) * 0.8) calc(var(--theme-primary-l) + 20%)) !important;
        color: hsl(var(--theme-primary-h) var(--theme-primary-s) calc(var(--theme-primary-l) - 20%)) !important;
      }
    `;
    
    customStyleElement.textContent = themeOverrides + '\n' + themeConfig.customCss;
  };

  const updateTheme = (newTheme: ThemeConfig) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};