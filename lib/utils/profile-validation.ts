/**
 * Profile Validation Utility
 * Checks user profile completeness and returns missing fields
 */

export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: {
    critical: string[];
    important: string[];
    optional: string[];
  };
  canBook: boolean;
}

export interface UserProfileData {
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  suburb?: string;
  experienceLevel?: string;
}

/**
 * Validates if a user profile is complete enough for booking
 */
export function validateProfileForBooking(profile: UserProfileData): ProfileCompletionStatus {
  const critical: string[] = [];
  const important: string[] = [];
  const optional: string[] = [];

  // Critical fields (required for booking)
  if (!profile.phone || profile.phone.trim() === '') {
    critical.push('phone');
  }
  if (!profile.address || profile.address.trim() === '') {
    critical.push('address');
  }
  if (!profile.suburb || profile.suburb.trim() === '') {
    critical.push('suburb');
  }

  // Important fields (highly recommended)
  if (!profile.fullName || profile.fullName.trim() === '') {
    important.push('fullName');
  }
  if (!profile.emergencyContact?.name || !profile.emergencyContact?.phone) {
    important.push('emergencyContact');
  }

  // Optional fields (nice to have)
  // Note: dateOfBirth field not yet in database, commented out for now
  // if (!profile.dateOfBirth || profile.dateOfBirth.trim() === '') {
  //   optional.push('dateOfBirth');
  // }
  if (!profile.experienceLevel) {
    optional.push('experienceLevel');
  }

  // Calculate completion percentage
  const totalFields = 6; // phone, address, suburb, fullName, emergencyContact, experienceLevel
  const completedFields = totalFields - (critical.length + important.length + optional.length);
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  // Can book only if no critical fields are missing
  const canBook = critical.length === 0;

  return {
    isComplete: critical.length === 0 && important.length === 0 && optional.length === 0,
    completionPercentage,
    missingFields: {
      critical,
      important,
      optional,
    },
    canBook, 
  };
}

/**
 * Get user-friendly field labels
 */
export function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    phone: 'Phone Number',
    address: 'Address',
    fullName: 'Full Name',
    emergencyContact: 'Emergency Contact',
    dateOfBirth: 'Date of Birth',
    suburb: 'Suburb',
    experienceLevel: 'Experience Level',
  };
  return labels[fieldName] || fieldName;
}

/**
 * Get user-friendly field descriptions
 */
export function getFieldDescription(fieldName: string): string {
  const descriptions: Record<string, string> = {
    phone: 'We need your phone number to contact you about lessons and emergencies',
    address: 'Your pickup address for driving lessons',
    fullName: 'Your full legal name for our records',
    emergencyContact: 'Someone we can contact in case of emergency',
    dateOfBirth: 'Required for insurance and legal purposes',
    suburb: 'Helps us match you with nearby instructors',
    experienceLevel: 'Helps us tailor lessons to your skill level',
  };
  return descriptions[fieldName] || '';
}
