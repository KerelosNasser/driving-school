'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { Package } from '@/lib/types';

interface PackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: Package | null;
  onSave: (packageData: Partial<Package>) => void;
}

export function PackageDialog({ open, onOpenChange, package: pkg, onSave }: PackageDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    hours: '',
    popular: false,
    features: [] as string[]
  });
  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name,
        description: pkg.description,
        price: pkg.price.toString(),
        hours: pkg.hours.toString(),
        popular: pkg.popular,
        features: [...pkg.features]
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        hours: '',
        popular: false,
        features: []
      });
    }
    setErrors({});
  }, [pkg, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Package name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.hours || parseInt(formData.hours) <= 0) newErrors.hours = 'Valid hours is required';
    if (formData.features.length === 0) newErrors.features = 'At least one feature is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        hours: parseInt(formData.hours),
        popular: formData.popular,
        features: formData.features
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
      if (errors.features) {
        setErrors(prev => ({ ...prev, features: '' }));
      }
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pkg ? 'Edit Package' : 'Create New Package'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Package"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="299.99"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="10"
                className={errors.hours ? 'border-red-500' : ''}
              />
              {errors.hours && <p className="text-sm text-red-500">{errors.hours}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="popular">Popular Package</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, popular: checked }))}
                />
                <Label htmlFor="popular" className="text-sm text-gray-600">
                  Mark as popular package
                </Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this package includes..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Features *</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a feature..."
                className="flex-1"
              />
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {errors.features && <p className="text-sm text-red-500">{errors.features}</p>}
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {pkg ? 'Update Package' : 'Create Package'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}