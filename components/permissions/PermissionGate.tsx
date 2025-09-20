/**
 * Permission-based conditional rendering components
 */

import React from 'react';
import { usePermissions, usePermission, useRoleAccess } from '../../lib/permissions/usePermissions';
import { UserRole, Resource, Operation } from '../../lib/permissions/types';

interface PermissionGateProps {
  resource: Resource;
  operation: Operation;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  resourceId?: string;
}

/**
 * Renders children only if user has the specified permission
 */
export function PermissionGate({ 
  resource, 
  operation, 
  children, 
  fallback = null,
  resourceId 
}: PermissionGateProps) {
  const { allowed, isLoading } = usePermission(resource, operation);
  
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />;
  }
  
  if (!allowed) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface RoleGateProps {
  minimumRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if user has the minimum required role
 */
export function RoleGate({ minimumRole, children, fallback = null }: RoleGateProps) {
  const { hasAccess, isLoading } = useRoleAccess(minimumRole);
  
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-16 rounded" />;
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  resource: Resource;
  operation: Operation;
  resourceId?: string;
  children: React.ReactNode;
  unauthorizedText?: string;
}

/**
 * Button that is disabled when user lacks permission
 */
export function PermissionButton({ 
  resource, 
  operation, 
  resourceId,
  children, 
  unauthorizedText = "Insufficient permissions",
  disabled,
  ...props 
}: PermissionButtonProps) {
  const { allowed, isLoading } = usePermission(resource, operation);
  
  const isDisabled = disabled || isLoading || !allowed;
  const title = !allowed ? unauthorizedText : props.title;
  
  return (
    <button
      {...props}
      disabled={isDisabled}
      title={title}
      className={`${props.className} ${!allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally wraps children with a wrapper component
 */
export function ConditionalWrapper({ condition, wrapper, children }: ConditionalWrapperProps) {
  return condition ? <>{wrapper(children)}</> : <>{children}</>;
}

interface PermissionIndicatorProps {
  resource: Resource;
  operation: Operation;
  showRole?: boolean;
  className?: string;
}

/**
 * Shows permission status indicator
 */
export function PermissionIndicator({ 
  resource, 
  operation, 
  showRole = false,
  className = ""
}: PermissionIndicatorProps) {
  const { allowed, isLoading } = usePermission(resource, operation);
  const { userRole } = usePermissions();
  
  if (isLoading) {
    return <div className={`animate-pulse bg-gray-200 h-2 w-2 rounded-full ${className}`} />;
  }
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className={`h-2 w-2 rounded-full ${allowed ? 'bg-green-500' : 'bg-red-500'}`}
        title={`${resource}.${operation}: ${allowed ? 'Allowed' : 'Denied'}`}
      />
      {showRole && (
        <span className="text-xs text-gray-500 capitalize">
          {userRole}
        </span>
      )}
    </div>
  );
}

interface PermissionTooltipProps {
  resource: Resource;
  operation: Operation;
  children: React.ReactNode;
}

/**
 * Wraps children with a tooltip showing permission status
 */
export function PermissionTooltip({ resource, operation, children }: PermissionTooltipProps) {
  const { allowed, isLoading } = usePermission(resource, operation);
  const { userRole } = usePermissions();
  
  if (isLoading) {
    return <>{children}</>;
  }
  
  const tooltipText = allowed 
    ? `Allowed: ${resource}.${operation} (Role: ${userRole})`
    : `Denied: ${resource}.${operation} (Role: ${userRole})`;
  
  return (
    <div title={tooltipText}>
      {children}
    </div>
  );
}