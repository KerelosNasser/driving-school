'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface ProfileCompletionBadgeProps {
  completionPercentage: number;
  canBook: boolean;
  className?: string;
}

export default function ProfileCompletionBadge({
  completionPercentage,
  canBook,
  className = ''
}: ProfileCompletionBadgeProps) {
  const getVariant = () => {
    if (completionPercentage === 100) return 'default';
    if (canBook) return 'secondary';
    return 'destructive';
  };

  const getIcon = () => {
    if (completionPercentage === 100) {
      return <CheckCircle className="h-3 w-3" />;
    }
    if (canBook) {
      return <Shield className="h-3 w-3" />;
    }
    return <AlertCircle className="h-3 w-3" />;
  };

  const getText = () => {
    if (completionPercentage === 100) return 'Profile Complete';
    if (canBook) return `Profile ${completionPercentage}%`;
    return 'Complete Profile';
  };

  return (
    <Badge variant={getVariant()} className={`flex items-center gap-1 ${className}`}>
      {getIcon()}
      <span className="text-xs">{getText()}</span>
    </Badge>
  );
}
