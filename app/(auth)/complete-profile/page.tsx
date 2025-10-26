'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, MapPin, User, Phone, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface FormData {
  fullName: string;
  phone: string;
  location: string;
  invitationCode: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  location?: string;
  invitationCode?: string;
  general?: string;
}

interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function CompleteProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    location: '',
    invitationCode: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [userInvitationCode, setUserInvitationCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Generate device fingerprint on component mount
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvas.toDataURL(),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack
      };
      
      // Create hash from fingerprint data
      const fingerprintString = JSON.stringify(fingerprint);
      let hash = 0;
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      setDeviceFingerprint(Math.abs(hash).toString(16));
    };

    generateFingerprint();
  }, []);

  // Pre-fill form with user data if available
  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      }));
    }
  }, [isLoaded, user]);

  // Validate individual fields
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
        return undefined;
      
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const phoneRegex = /^[\+]?[1-9][\d]{0,3}[\s\-\.]?[\(]?[\d]{1,3}[\)]?[\s\-\.]?[\d]{1,4}[\s\-\.]?[\d]{1,9}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number';
        return undefined;
      
      case 'location':
        if (!value.trim()) return 'Location is required';
        if (value.trim().length < 3) return 'Please enter a more specific location';
        return undefined;
      
      case 'invitationCode':
        if (value && !/^[A-Z0-9]{8}$/.test(value.toUpperCase())) {
          return 'Invitation code must be 8 characters (letters and numbers only)';
        }
        return undefined;
      
      default:
        return undefined;
    }
  };

  // Handle input changes with real-time validation
  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear previous error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Validate field in real-time
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    
    // Handle location autocomplete
    if (name === 'location' && value.length >= 3) {
      handleLocationSearch(value);
    } else if (name === 'location' && value.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle location search with debouncing
  const handleLocationSearch = async (query: string) => {
    if (query.length < 3) return;
    
    setIsLoadingLocation(true);
    try {
      const response = await fetch(`/api/location-autocomplete?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data.predictions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({ ...prev, location: suggestion.description }));
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setErrors(prev => ({ ...prev, location: undefined }));
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          deviceFingerprint,
          userAgent: navigator.userAgent,
          ipAddress: null // Will be set server-side
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'An error occurred' });
        }
        toast.error(data.message || 'Failed to complete profile');
        return;
      }
      
      // Set user's invitation code
      if (data.invitationCode) {
        setUserInvitationCode(data.invitationCode);
      }
      
      toast.success('Profile completed successfully!');
      
      // Redirect to dashboard or home page
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      console.error('Profile completion error:', error);
      setErrors({ general: 'Network error. Please try again.' });
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy invitation code to clipboard
  const copyInvitationCode = async () => {
    if (!userInvitationCode) return;
    
    try {
      await navigator.clipboard.writeText(userInvitationCode);
      setCopiedCode(true);
      toast.success('Invitation code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error('Failed to copy invitation code'+error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Please provide additional information to complete your account setup.
            You'll receive your unique invitation code after completing this form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
            
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? 'border-red-500' : ''}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-red-500">
                  {errors.fullName}
                </p>
              )}
            </div>
            
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
              </div>
              {errors.phone && (
                <p id="phone-error" className="text-sm text-red-500">
                  {errors.phone}
                </p>
              )}
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your city or address"
                  className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
                  aria-describedby={errors.location ? 'location-error' : undefined}
                  autoComplete="off"
                />
                {isLoadingLocation && (
                  <div className="absolute right-3 top-3">
                    <LoadingIndicator color="#059669" size="small" variant="lines" />
                  </div>
                )}
                
                {/* Location Suggestions */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                        <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.location && (
                <p id="location-error" className="text-sm text-red-500">
                  {errors.location}
                </p>
              )}
            </div>
            
            {/* Invitation Code */}
            <div className="space-y-2">
              <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="invitationCode"
                  type="text"
                  value={formData.invitationCode}
                  onChange={(e) => handleInputChange('invitationCode', e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  className={`pl-10 ${errors.invitationCode ? 'border-red-500' : ''}`}
                  aria-describedby={errors.invitationCode ? 'invitationCode-error' : undefined}
                  maxLength={8}
                />
              </div>
              {errors.invitationCode && (
                <p id="invitationCode-error" className="text-sm text-red-500">
                  {errors.invitationCode}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Have an invitation code? Enter it to give your referrer rewards!
              </p>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingIndicator color="#ffffff" size="small" variant="lines" />
                  Completing Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
          
          {/* User's Invitation Code Display */}
          {userInvitationCode && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Your Invitation Code</h3>
              <p className="text-sm text-green-700 mb-3">
                Share this code with friends to earn rewards! You'll get a 30% discount after 1 successful referral,
                and 2 free driving hours after 3 successful referrals.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded font-mono text-lg tracking-wider">
                  {userInvitationCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyInvitationCode}
                  className="flex items-center gap-1"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}