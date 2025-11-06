/**
 * Scope Management Utility for Google API Integration
 * Implements incremental authorization and scope validation following 2025 best practices
 */

export interface ScopeRequirement {
  operation: string;
  requiredScopes: string[];
  description: string;
  category: 'calendar' | 'business' | 'drive' | 'admin';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScopeRecommendation {
  scopes: string[];
  reason: string;
  confidence: number; // 0-1
  estimatedUsage: 'low' | 'medium' | 'high';
}

export interface ScopeValidationResult {
  valid: boolean;
  missingScopes: string[];
  canProceed: boolean;
  recommendations?: string[];
}

export class GoogleAPIScopeManager {
  private static readonly SCOPE_REQUIREMENTS: ScopeRequirement[] = [
    // Calendar operations
    {
      operation: 'calendar.list',
      requiredScopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      description: 'List calendar events',
      category: 'calendar',
      priority: 'medium',
    },
    {
      operation: 'calendar.create',
      requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
      description: 'Create calendar events',
      category: 'calendar',
      priority: 'high',
    },
    {
      operation: 'calendar.update',
      requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
      description: 'Update calendar events',
      category: 'calendar',
      priority: 'high',
    },
    {
      operation: 'calendar.delete',
      requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
      description: 'Delete calendar events',
      category: 'calendar',
      priority: 'high',
    },
    {
      operation: 'calendar.settings',
      requiredScopes: ['https://www.googleapis.com/auth/calendar.settings'],
      description: 'Access calendar settings',
      category: 'calendar',
      priority: 'medium',
    },
    // Business operations
    {
      operation: 'business.info',
      requiredScopes: ['https://www.googleapis.com/auth/business.manage'],
      description: 'Manage business information',
      category: 'business',
      priority: 'high',
    },
    {
      operation: 'business.listings',
      requiredScopes: ['https://www.googleapis.com/auth/business.listings'],
      description: 'Manage business listings',
      category: 'business',
      priority: 'medium',
    },
    // Drive operations
    {
      operation: 'drive.file',
      requiredScopes: ['https://www.googleapis.com/auth/drive.file'],
      description: 'Access Drive files created by this app',
      category: 'drive',
      priority: 'medium',
    },
  ];

  private static readonly SCOPE_CATEGORIES = {
    calendar: {
      name: 'Calendar Management',
      description: 'Access to calendar events and settings',
      icon: '📅',
    },
    business: {
      name: 'Business Information',
      description: 'Manage business listings and information',
      icon: '🏢',
    },
    drive: {
      name: 'File Management',
      description: 'Access to Google Drive files',
      icon: '📁',
    },
    admin: {
      name: 'Administration',
      description: 'Administrative functions',
      icon: '⚙️',
    },
  };

  /**
   * Validate if current scopes are sufficient for an operation
   */
  static validateScopesForOperation(operation: string, grantedScopes: string[]): ScopeValidationResult {
    const requirement = this.SCOPE_REQUIREMENTS.find(req => req.operation === operation);
    
    if (!requirement) {
      return {
        valid: false,
        missingScopes: [],
        canProceed: false,
        recommendations: ['Unknown operation - manual scope validation required'],
      };
    }

    const grantedScopeSet = new Set(grantedScopes);
    const missingScopes = requirement.requiredScopes.filter(scope => !grantedScopeSet.has(scope));

    return {
      valid: missingScopes.length === 0,
      missingScopes,
      canProceed: missingScopes.length === 0,
      recommendations: missingScopes.length > 0 ? 
        [`Add ${missingScopes.join(', ')} to perform ${requirement.description}`] : 
        undefined,
    };
  }

  /**
   * Get scope requirements for multiple operations
   */
  static getScopeRequirementsForOperations(operations: string[]): ScopeRequirement[] {
    return operations.map(operation => 
      this.SCOPE_REQUIREMENTS.find(req => req.operation === operation)
    ).filter((req): req is ScopeRequirement => req !== undefined);
  }

  /**
   * Recommend scopes based on user role, usage patterns, and context
   */
  static recommendScopes(options: {
    userRole?: string;
    usageContext?: string;
    currentScopes?: string[];
    plannedOperations?: string[];
    userPreferences?: Record<string, any>;
  }): ScopeRecommendation {
    const { userRole, usageContext, currentScopes = [], plannedOperations = [] } = options;
    
    let recommendedScopes = new Set<string>();
    let reason = '';
    let confidence = 0.8;
    let estimatedUsage = 'medium' as const;

    // Base scopes (always recommended)
    const baseScopes = ['openid', 'profile', 'email'];
    baseScopes.forEach(scope => recommendedScopes.add(scope));

    // Role-based recommendations
    switch (userRole) {
      case 'admin':
        reason = 'Administrator role requires full access';
        confidence = 0.95;
        estimatedUsage = 'high';
        
        // Add all calendar scopes
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.readonly');
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.events');
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.settings');
        
        // Add business scopes
        recommendedScopes.add('https://www.googleapis.com/auth/business.manage');
        recommendedScopes.add('https://www.googleapis.com/auth/business.listings');
        
        // Add drive scope
        recommendedScopes.add('https://www.googleapis.com/auth/drive.file');
        break;

      case 'manager':
        reason = 'Manager role requires calendar and business access';
        confidence = 0.9;
        estimatedUsage = 'high';
        
        // Add calendar scopes
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.readonly');
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.events');
        
        // Add business scopes
        recommendedScopes.add('https://www.googleapis.com/auth/business.manage');
        recommendedScopes.add('https://www.googleapis.com/auth/business.listings');
        break;

      case 'staff':
        reason = 'Staff role requires calendar management';
        confidence = 0.85;
        estimatedUsage = 'medium';
        
        // Add calendar scopes
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.readonly');
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.events');
        break;

      default:
        reason = 'Basic user role with read-only access';
        confidence = 0.7;
        estimatedUsage = 'low';
        
        // Add read-only calendar scope
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.readonly');
        break;
    }

    // Operation-based recommendations
    if (plannedOperations.length > 0) {
      const operationRequirements = this.getScopeRequirementsForOperations(plannedOperations);
      operationRequirements.forEach(req => {
        req.requiredScopes.forEach(scope => recommendedScopes.add(scope));
      });
      
      reason += ` Based on planned operations: ${plannedOperations.join(', ')}`;
      confidence = Math.min(confidence + 0.1, 1.0);
    }

    // Context-based recommendations
    switch (usageContext) {
      case 'booking_system':
        reason += ' Booking system requires calendar management';
        recommendedScopes.add('https://www.googleapis.com/auth/calendar.events');
        break;
      
      case 'business_management':
        reason += ' Business management requires business information access';
        recommendedScopes.add('https://www.googleapis.com/auth/business.manage');
        recommendedScopes.add('https://www.googleapis.com/auth/business.listings');
        break;
      
      case 'file_sharing':
        reason += ' File sharing requires Drive access';
        recommendedScopes.add('https://www.googleapis.com/auth/drive.file');
        break;
    }

    // Filter out already granted scopes
    const finalScopes = Array.from(recommendedScopes).filter(scope => !currentScopes.includes(scope));

    return {
      scopes: finalScopes,
      reason,
      confidence,
      estimatedUsage,
    };
  }

  /**
   * Group scopes by category for better user presentation
   */
  static groupScopesByCategory(scopes: string[]): Record<string, { scopes: string[]; category: any }> {
    const grouped: Record<string, { scopes: string[]; category: any }> = {};

    scopes.forEach(scope => {
      const requirement = this.SCOPE_REQUIREMENTS.find(req => 
        req.requiredScopes.includes(scope)
      );

      const category = requirement?.category || 'other';
      
      if (!grouped[category]) {
        grouped[category] = {
          scopes: [],
          category: this.SCOPE_CATEGORIES[category] || {
            name: 'Other',
            description: 'Other permissions',
            icon: '🔧',
          },
        };
      }

      grouped[category].scopes.push(scope);
    });

    return grouped;
  }

  /**
   * Get user-friendly descriptions for scopes
   */
  static getScopeDescriptions(scopes: string[]): Record<string, string> {
    const descriptions: Record<string, string> = {};

    scopes.forEach(scope => {
      const requirement = this.SCOPE_REQUIREMENTS.find(req => 
        req.requiredScopes.includes(scope)
      );

      if (requirement) {
        descriptions[scope] = requirement.description;
      } else {
        // Provide default descriptions for common scopes
        switch (scope) {
          case 'openid':
            descriptions[scope] = 'Authenticate using your Google account';
            break;
          case 'profile':
            descriptions[scope] = 'View your basic profile information';
            break;
          case 'email':
            descriptions[scope] = 'View your email address';
            break;
          default:
            descriptions[scope] = `Access ${scope.split('/').pop()?.replace(/\./g, ' ')}`;
            break;
        }
      }
    });

    return descriptions;
  }

  /**
   * Store granted scopes for a user (placeholder for database integration)
   */
  static async storeGrantedScopes(userId: string, scopeString: string): Promise<void> {
    try {
      const scopes = scopeString.split(' ').filter(s => s.trim());
      const scopeAnalysis = this.analyzeScopes(scopeString);
      
      // This would typically store in a database
      // For now, we'll log the information
      console.log(`Stored granted scopes for user ${userId}:`, {
        scopes,
        categories: scopeAnalysis.categories,
        tier: scopeAnalysis.tier,
        timestamp: new Date().toISOString()
      });
      
      // TODO: Implement actual database storage
      // Example: await db.userScopes.create({
      //   userId,
      //   scopes,
      //   categories: scopeAnalysis.categories,
      //   tier: scopeAnalysis.tier,
      //   grantedAt: new Date()
      // });
      
    } catch (error) {
      console.error('Failed to store granted scopes:', error);
      // Don't throw - this is not critical for the OAuth flow
    }
  }

  /**
   * Get stored scopes for a user (placeholder for database integration)
   */
  static async getStoredScopes(userId: string): Promise<string[]> {
    try {
      // TODO: Implement actual database retrieval
      // Example: const userScopes = await db.userScopes.findUnique({ where: { userId } });
      // return userScopes?.scopes || [];
      
      console.log(`Retrieving stored scopes for user ${userId}`);
      return []; // Return empty array for now
      
    } catch (error) {
      console.error('Failed to retrieve stored scopes:', error);
      return [];
    }
  }

  /**
   * Validate scope escalation request
   */
  static validateScopeEscalation(currentScopes: string[], requestedScopes: string[]): {
    isValid: boolean;
    escalationReason: string;
    securityRecommendation: string;
  } {
    const currentSet = new Set(currentScopes);
    const newScopes = requestedScopes.filter(scope => !currentSet.has(scope));

    if (newScopes.length === 0) {
      return {
        isValid: false,
        escalationReason: 'No new scopes requested',
        securityRecommendation: 'No escalation needed',
      };
    }

    // Check for sensitive scope escalations
    const sensitiveScopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/drive.file',
    ];

    const hasSensitiveEscalation = newScopes.some(scope => sensitiveScopes.includes(scope));

    return {
      isValid: true,
      escalationReason: hasSensitiveEscalation ? 
        'Request includes sensitive permissions that require additional review' : 
        'Standard scope escalation',
      securityRecommendation: hasSensitiveEscalation ? 
        'Consider implementing additional security measures such as admin approval or time-limited access' : 
        'Standard escalation process is sufficient',
    };
  }
}