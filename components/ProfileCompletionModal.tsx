'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  Users,
  Loader2,
  Shield
} from 'lucide-react';
import { getFieldLabel, getFieldDescription } from '@/lib/utils/profile-validation';
import { toast } from 'sonner';

interface ProfileCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields: {
    critical: string[];
    important: string[];
    optional: string[];
  };
  onComplete: () => void;
  initialData?: any;
}

export default function ProfileCompletionModal({
  open,
  onOpenChange,
  missingFields,
  onComplete,
  initialData = {}
}: ProfileCompletionModalProps) {
  const [formData, setFormData] = useState({
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    fullName: initialData?.fullName || '',
    suburb: initialData?.suburb || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    experienceLevel: initialData?.experienceLevel || '',
    emergencyContactName: initialData?.emergencyContact?.name || '',
    emergencyContactPhone: initialData?.emergencyContact?.phone || '',
    emergencyContactRelationship: initialData?.emergencyContact?.relationship || '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Service areas from your map
  const serviceAreas = [
    'Brisbane CBD', 'South Brisbane', 'West End', 'Fortitude Valley', 
    'New Farm', 'Paddington', 'Milton', 'Toowong', 'St Lucia', 
    'Indooroopilly', 'Kelvin Grove', 'Chermside', 'Carindale', 
    'Mount Gravatt', 'Sunnybank', 'Wynnum', 'Sandgate', 'The Gap'
  ];

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        phone: initialData.phone || '',
        address: initialData.address || '',
        fullName: initialData.fullName || '',
        suburb: initialData.suburb || '',
        dateOfBirth: initialData.dateOfBirth || '',
        experienceLevel: initialData.experienceLevel || '',
        emergencyContactName: initialData.emergencyContact?.name || '',
        emergencyContactPhone: initialData.emergencyContact?.phone || '',
        emergencyContactRelationship: initialData.emergencyContact?.relationship || '',
      });
    }
  }, [initialData]);

  const totalMissing = missingFields.critical.length + missingFields.important.length + missingFields.optional.length;
  const criticalCount = missingFields.critical.length;

  const validateAustralianPhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Australian mobile: starts with 04 and has 10 digits total
    // Australian landline: starts with 0 and has 10 digits total
    // International format: +61 followed by 9 digits (without leading 0)
    
    if (cleaned.startsWith('61')) {
      // International format +61
      return cleaned.length === 11 && (cleaned[2] === '4' || cleaned[2] === '2' || cleaned[2] === '3' || cleaned[2] === '7' || cleaned[2] === '8');
    }
    
    if (cleaned.startsWith('0')) {
      // Australian format
      return cleaned.length === 10;
    }
    
    return false;
  };

  const formatAustralianPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('61')) {
      // Format: +61 4XX XXX XXX
      return `+61 ${cleaned.slice(2, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
    }
    
    if (cleaned.startsWith('04')) {
      // Mobile: 04XX XXX XXX
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
    }
    
    if (cleaned.startsWith('0')) {
      // Landline: (0X) XXXX XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
    }
    
    return phone;
  };

  const validateField = (name: string, value: string): string | null => {
    if (missingFields.critical.includes(name) && !value.trim()) {
      return `${getFieldLabel(name)} is required`;
    }
    
    if ((name === 'phone' || name === 'emergencyContactPhone') && value) {
      if (!validateAustralianPhone(value)) {
        return 'Please enter a valid Australian phone number (e.g., 0412 345 678 or +61 412 345 678)';
      }
    }

    return null;
  };

  const handleChange = (name: string, value: string) => {
    // Auto-format phone numbers
    if (name === 'phone' || name === 'emergencyContactPhone') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 11) {
        value = formatAustralianPhone(value);
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate on change
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all critical fields
    const newErrors: Record<string, string> = {};
    missingFields.critical.forEach(field => {
      const fieldName = field === 'emergencyContact' ? 'emergencyContactName' : field;
      const value = formData[fieldName as keyof typeof formData];
      const error = validateField(field, value);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Update user profile
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          address: formData.address,
          full_name: formData.fullName,
          suburb: formData.suburb,
          // Note: date_of_birth field doesn't exist in database yet
          // date_of_birth: formData.dateOfBirth || null,
          experience_level: formData.experienceLevel || null,
          emergency_contact: {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'phone':
      case 'emergencyContactPhone':
        return <Phone className="h-4 w-4" />;
      case 'address':
      case 'suburb':
        return <MapPin className="h-4 w-4" />;
      case 'fullName':
      case 'emergencyContactName':
        return <User className="h-4 w-4" />;
      case 'dateOfBirth':
        return <Calendar className="h-4 w-4" />;
      case 'emergencyContact':
        return <Users className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const renderField = (fieldName: string, isCritical: boolean = false) => {
    let inputName = fieldName;
    let inputValue = formData[fieldName as keyof typeof formData];
    let inputType = 'text';
    let placeholder = '';

    // Handle special cases
    if (fieldName === 'emergencyContact') {
      return (
        <div key={fieldName} className="space-y-3 p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-bold text-orange-900">Emergency Contact</Label>
              {isCritical && <span className="text-red-500 text-xs ml-2">*Required</span>}
            </div>
          </div>
          <p className="text-xs text-orange-700 mb-3">{getFieldDescription('emergencyContact')}</p>
          
          <div>
            <Label htmlFor="emergencyContactName" className="text-xs font-semibold text-gray-700 mb-1.5 block">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                placeholder="John Doe"
                className={`pl-10 h-11 bg-white/80 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${errors.emergencyContactName ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.emergencyContactName && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3" />
                {errors.emergencyContactName}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="emergencyContactPhone" className="text-xs font-semibold text-gray-700 mb-1.5 block">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                placeholder="0412 345 678"
                className={`pl-10 h-11 bg-white/80 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.emergencyContactPhone && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3" />
                {errors.emergencyContactPhone}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="emergencyContactRelationship" className="text-xs font-semibold text-gray-700 mb-1.5 block">Relationship</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                placeholder="Parent, Spouse, Friend, etc."
                className="pl-10 h-11 bg-white/80 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      );
    }

    if (fieldName === 'dateOfBirth') {
      inputType = 'date';
    }

    if (fieldName === 'phone') {
      placeholder = '0412 345 678';
    } else if (fieldName === 'address') {
      placeholder = '123 Main Street';
    } else if (fieldName === 'suburb') {
      placeholder = 'Start typing suburb name...';
    } else if (fieldName === 'fullName') {
      placeholder = 'John Doe';
    } else if (fieldName === 'experienceLevel') {
      placeholder = 'Beginner, Intermediate, Advanced';
    }

    // Special rendering for suburb field with dropdown
    if (fieldName === 'suburb') {
      return (
        <div key={fieldName} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-100 rounded">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <Label htmlFor={inputName} className="text-sm font-semibold text-gray-700">
              {getFieldLabel(fieldName)}
              {isCritical && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{getFieldDescription(fieldName)}</p>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <select
              id={inputName}
              value={inputValue}
              onChange={(e) => handleChange(inputName, e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 h-11 border rounded-lg bg-white/80 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer transition-all ${errors[inputName] ? 'border-red-500' : 'border-gray-300'}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23059669' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '12px'
              }}
            >
              <option value="">Select your suburb...</option>
              {serviceAreas.map((suburb) => (
                <option key={suburb} value={suburb}>
                  {suburb}
                </option>
              ))}
            </select>
          </div>
          {errors[inputName] && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" />
              {errors[inputName]}
            </p>
          )}
        </div>
      );
    }

    const fieldIcon = getFieldIcon(fieldName);
    const showIcon = ['phone', 'address', 'fullName', 'dateOfBirth'].includes(fieldName);

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-100 rounded">
            {React.cloneElement(fieldIcon as React.ReactElement, { className: 'h-3.5 w-3.5 text-emerald-600' })}
          </div>
          <Label htmlFor={inputName} className="text-sm font-semibold text-gray-700">
            {getFieldLabel(fieldName)}
            {isCritical && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{getFieldDescription(fieldName)}</p>
        <div className="relative">
          {showIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {fieldIcon}
            </div>
          )}
          <Input
            id={inputName}
            type={inputType}
            value={inputValue}
            onChange={(e) => handleChange(inputName, e.target.value)}
            placeholder={placeholder}
            className={`h-11 bg-white/80 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${showIcon ? 'pl-10' : ''} ${errors[inputName] ? 'border-red-500' : ''}`}
          />
        </div>
        {errors[inputName] && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors[inputName]}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-emerald-50 to-teal-50">
        {/* Header with gradient background matching service center */}
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-800 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/20 rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl mb-2">
              <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Complete Your Profile</div>
                <div className="text-emerald-100 text-xs sm:text-sm font-normal mt-0.5">Required for booking</div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-emerald-50 leading-relaxed">
              We need some additional information to provide better service and ensure your safety.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Progress Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200/60 shadow-lg p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">Profile Completion</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {totalMissing} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${totalMissing > 0 ? ((6 - totalMissing) / 6) * 100 : 100}%` }}
              />
            </div>
          </div>

          {criticalCount > 0 && (
            <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm">
                <strong className="text-red-700">{criticalCount} required field{criticalCount > 1 ? 's' : ''} missing.</strong>
                <span className="text-red-600"> Please complete them to proceed with booking.</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Critical Fields */}
            {missingFields.critical.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200/60 shadow-lg p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-red-200">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-red-700">
                      Required Information
                    </h3>
                    <p className="text-xs text-red-600">Must be completed to book lessons</p>
                  </div>
                </div>
                {missingFields.critical.map(field => renderField(field, true))}
              </div>
            )}

            {/* Important Fields */}
            {missingFields.important.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200/60 shadow-lg p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-orange-200">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-orange-700">
                      Recommended Information
                    </h3>
                    <p className="text-xs text-orange-600">Helps us serve you better</p>
                  </div>
                </div>
                {missingFields.important.map(field => renderField(field, false))}
              </div>
            )}

            {/* Optional Fields */}
            {missingFields.optional.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-lg p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-700">
                      Optional Information
                    </h3>
                    <p className="text-xs text-gray-600">Complete at your convenience</p>
                  </div>
                </div>
                {missingFields.optional.map(field => renderField(field, false))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-gradient-to-t from-emerald-50 via-emerald-50 to-transparent pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base font-medium border-2 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
                disabled={saving || criticalCount > 0 && Object.keys(errors).length > 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Save & Continue
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
