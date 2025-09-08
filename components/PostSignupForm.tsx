'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, User, CheckCircle,Gift, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { validatePhoneNumber, formatPhoneInput,formatForStorage, isTestPhoneBypassEnabled, isBypassPhoneNumber } from '@/lib/phone';

interface PostSignupFormProps {
  onComplete: () => void;
}


const experienceLevels = [
  { value: 'beginner', label: 'Complete Beginner' },
  { value: 'some_experience', label: 'Some Experience' },
  { value: 'experienced', label: 'Experienced (Need Test Prep)' },
  { value: 'refresher', label: 'Refresher Course' }
];

export default function PostSignupForm({ onComplete }: PostSignupFormProps) {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);


  // Check if user is admin - don't show form for admin users
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  // Don't render form for admin users
  if (isAdmin) {
    return null;
  }

  // Form data
  const [formData, setFormData] = useState({
    fullName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
    phone: '',
    address: '',
    suburb: '',
    location: '',
    experienceLevel: '',
    goals: '',
    previousInstructor: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    preferredContactMethod: 'email',
    invitationCode: ''
  });

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Location autocomplete function
  const handleLocationSearch = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setLoadingLocationSuggestions(true);
    try {
      const response = await fetch(`/api/location-autocomplete?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data.suggestions || []);
        setShowLocationSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    } catch (error) {
      console.error('Location autocomplete error:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      setLoadingLocationSuggestions(false);
    }
  };

  const selectLocationSuggestion = (suggestion: any) => {
    handleInputChange('suburb', suggestion.description);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  // Real OTP functions using Supabase Auth
  const sendOtp = async () => {
    if (!formData.phone) {
      setError('Please enter a phone number first');
      toast.error('Please enter a phone number first');
      return;
    }

    // Dev/Test bypass: instantly verify if enabled and using reserved test number
    const bypassActive = isTestPhoneBypassEnabled(false) && isBypassPhoneNumber(formData.phone);
    if (bypassActive) {
      setOtpVerified(true);
      setOtpSent(false);
      setError('');
      toast.success('Test bypass active: phone verified');
      return;
    }

    // Validate phone number using comprehensive validation
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Please enter a valid phone number');
      toast.error(phoneValidation.error || 'Please enter a valid phone number');
      return;
    }

    setSendingOtp(true);
    try {
      // Use properly formatted phone number for OTP
      const formattedPhone = formatForStorage(formData.phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone as string,
        options: {
          shouldCreateUser: false // We don't want to create a user, just verify the phone
        }
      });

      if (error) {
        throw error;
      }

      setOtpSent(true);
      setError('');
      toast.success('OTP sent successfully! Please check your phone.');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) {
      setError('Please enter the OTP code');
      toast.error('Please enter the OTP code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: formData.phone,
        token: otpCode,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      setOtpVerified(true);
      setOtpSent(false);
      setOtpCode('');
      setError('');
      toast.success('Phone number verified successfully!');
      
      // Sign out immediately after verification since we only needed to verify the phone
      await supabase.auth.signOut();
    } catch (err: any) {
      const errorMessage = err.message === 'Invalid token' 
        ? 'Invalid OTP code. Please check and try again.'
        : err.message || 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Invitation code validation function

  const validateStep = (currentStep: number): boolean => {
    setError(''); // Clear previous errors
    
    switch (currentStep) {
      case 1:
        // Step 1: Contact Information
        const missingFields = [];
        
        if (!formData.fullName?.trim()) missingFields.push('Full name');
        if (!formData.phone?.trim()) missingFields.push('Phone number');
        if (!formData.address?.trim()) missingFields.push('Street address');
        if (!formData.suburb?.trim()) missingFields.push('Suburb');
        
        if (missingFields.length > 0) {
          const errorMsg = `Please fill in: ${missingFields.join(', ')}`;
          setError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
        
        // Check phone verification
        const bypassActive = isTestPhoneBypassEnabled(false) && isBypassPhoneNumber(formData.phone);
        if (!otpVerified && !bypassActive) {
          setError('Please verify your phone number with OTP');
          toast.error('Please verify your phone number with OTP');
          return false;
        }
        break;
        
      case 2:
        // Step 2: Experience and Emergency Contact
        const missingStep2Fields = [];
        
        if (!formData.experienceLevel) missingStep2Fields.push('Experience level');
        if (!formData.goals?.trim()) missingStep2Fields.push('Learning goals');
        if (!formData.emergencyContact?.trim()) missingStep2Fields.push('Emergency contact name');
        if (!formData.emergencyPhone?.trim()) missingStep2Fields.push('Emergency contact phone');
        
        if (missingStep2Fields.length > 0) {
          const errorMsg = `Please fill in: ${missingStep2Fields.join(', ')}`;
          setError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
        
        // Validate emergency phone
        const emergencyPhoneValidation = validatePhoneNumber(formData.emergencyPhone);
        if (!emergencyPhoneValidation.isValid) {
          const errorMsg = 'Please enter a valid emergency contact phone number';
          setError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
        
        // Validate invitation code if provided
        if (formData.invitationCode && formData.invitationCode.trim()) {
          if (!/^[A-Z0-9]{8}$/.test(formData.invitationCode.trim())) {
            const errorMsg = 'Invitation code must be exactly 8 characters (letters and numbers only)';
            setError(errorMsg);
            toast.error(errorMsg);
            return false;
          }
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Generate device fingerprint (simple version)
      const deviceFingerprint = `${navigator.userAgent}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;
      
      // Submit profile completion data
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName || user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
          phone: formData.phone,
          location: formData.suburb || formData.address, // Use suburb as location since that's what we collect
          invitationCode: formData.invitationCode || undefined,
          deviceFingerprint,
          userAgent: navigator.userAgent
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to complete profile');
      }
      
      console.log('Profile completion response:', responseData);

      // Mark profile as completed
      if (user && !responseData.debug) {
        try {
          await user.update({
            publicMetadata: {
              ...user.publicMetadata,
              profileCompleted: true,
            },
          });
        } catch (updateError) {
          console.error('Error updating user metadata:', updateError);
          // Don't fail the whole flow for this
        }
      }

      // Show success message with invitation code if provided
      if (responseData.invitationCode) {
        toast.success(`Profile completed successfully! Your invitation code: ${responseData.invitationCode}`, {
          duration: 5000
        });
      } else {
        toast.success('Profile completed successfully! Welcome aboard!');
      }
      
      // Complete the onboarding flow
      onComplete();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      const errorMessage = err.message || 'Failed to complete profile. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
              <p className="text-gray-600">Let's start with your basic contact details</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+61 4XX XXX XXX or 04XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneInput(e.target.value);
                      handleInputChange('phone', formatted);
                    }}
                    className={`flex-1 ${
                      otpVerified ? 'border-green-500 bg-green-50' : 
                      formData.phone && !otpVerified ? 'border-yellow-500' : ''
                    }`}
                    disabled={otpVerified}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sendOtp}
                    disabled={!formData.phone || otpVerified || sendingOtp}
                    className="whitespace-nowrap"
                  >
                    {sendingOtp ? 'Sending...' : otpVerified ? '✓ Verified' : 'Send OTP'}
                  </Button>
                </div>
                {otpVerified && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Phone number verified
                  </p>
                )}
              </div>

              {/* OTP Input Field */}
              {otpSent && !otpVerified && (
                <div>
                  <Label htmlFor="otp">Enter OTP Code *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={verifyOtp}
                      disabled={!otpCode || verifyingOtp}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Please check your phone for the verification code
                  </p>
                </div>
              )}


              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="relative">
                <Label htmlFor="suburb">Suburb *</Label>
                <Input
                  id="suburb"
                  placeholder="Start typing your suburb..."
                  value={formData.suburb}
                  onChange={(e) => {
                    handleInputChange('suburb', e.target.value);
                    handleLocationSearch(e.target.value);
                  }}
                  onFocus={() => {
                    if (formData.suburb.length >= 2) {
                      setShowLocationSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow for selection
                    setTimeout(() => setShowLocationSuggestions(false), 200);
                  }}
                  className={`mt-1 ${
                    formData.suburb ? 'border-green-500' : ''
                  }`}
                />
                {loadingLocationSuggestions && (
                  <div className="absolute right-3 top-9 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
                
                {/* Location Suggestions Dropdown */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => selectLocationSuggestion(suggestion)}
                      >
                        <div className="font-medium">{suggestion.structured_formatting?.main_text || suggestion.description}</div>
                        {suggestion.structured_formatting?.secondary_text && (
                          <div className="text-gray-500 text-xs">{suggestion.structured_formatting.secondary_text}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
              <p className="text-gray-600">Tell us about your driving background, goals, and emergency contact</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goals">Learning Goals *</Label>
                <Textarea
                  id="goals"
                  placeholder="What do you hope to achieve? (e.g., pass driving test, improve confidence, learn specific skills)"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="previousInstructor">Previous Instructor (Optional)</Label>
                <Input
                  id="previousInstructor"
                  placeholder="Have you had lessons with another instructor?"
                  value={formData.previousInstructor}
                  onChange={(e) => handleInputChange('previousInstructor', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {/* Invitation Code Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-yellow-500" />
                  <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
                </div>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Enter 8-character code (e.g., ABC12345)"
                  value={formData.invitationCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                    handleInputChange('invitationCode', value);
                  }}
                  className="mt-1"
                  maxLength={8}
                />
                <div className="flex items-start gap-2 p-3 bg-yellow-500 border border-yellow-200 rounded-lg">
                  <Info className="h-4 w-4 text-yellow-950 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Get exclusive perks by entering an invitation code!</p>
                    <ul className="text-xs space-y-1">
                      <li>• Give your referrer a 30% discount after 1 successful signup</li>
                      <li>• Help them earn 2 free driving hours after 3 successful signups</li>
                      <li>• Join our referral network and earn your own rewards</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Emergency Contact Information</h3>
                
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Full name of emergency contact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    placeholder="+61 4XX XXX XXX or 04XX XXX XXX"
                    value={formData.emergencyPhone}
                    onChange={(e) => {
                      const formatted = formatPhoneInput(e.target.value);
                      handleInputChange('emergencyPhone', formatted);
                    }}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="medicalConditions">Medical Conditions (Optional)</Label>
                  <Textarea
                    id="medicalConditions"
                    placeholder="Any medical conditions we should be aware of for your safety"
                    value={formData.medicalConditions}
                    onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-lg">
            Welcome! Let's set up your profile to get started with your driving lessons.
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 mt-2">
              Step {step} of {totalSteps}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : step === totalSteps ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Profile
                </div>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}