'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ color, onChange, label, className = '' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempColor(value);
    
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value) || /^#[0-9A-F]{3}$/i.test(value)) {
      onChange(value);
    }
  };

  const handleInputBlur = () => {
    // If invalid color, revert to last valid color
    if (!/^#[0-9A-F]{6}$/i.test(tempColor) && !/^#[0-9A-F]{3}$/i.test(tempColor)) {
      setTempColor(color);
    }
  };

  // Common color presets
  const colorPresets = [
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#059669', '#0891b2', '#0284c7', '#1d4ed8',
    '#1e40af', '#7c3aed', '#9333ea', '#c026d3', '#db2777',
    '#be185d', '#dc2626', '#ea580c', '#d97706', '#ca8a04',
    '#65a30d', '#16a34a', '#047857', '#0e7490', '#0369a1'
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-sm">{label}</Label>}
      
      <div className="flex items-center space-x-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-10 p-1 border-2"
              style={{ backgroundColor: color }}
            >
              <div 
                className="w-full h-full rounded border border-white/20"
                style={{ backgroundColor: color }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Color Picker</Label>
                <input
                  ref={inputRef}
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-20 rounded border border-gray-200 cursor-pointer"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Hex Value</Label>
                <Input
                  type="text"
                  value={tempColor}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Color Presets</Label>
                <div className="grid grid-cols-7 gap-1">
                  {colorPresets.map((presetColor) => (
                    <button
                      key={presetColor}
                      onClick={() => handleColorChange(presetColor)}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: presetColor }}
                      title={presetColor}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Input
          type="text"
          value={tempColor}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}