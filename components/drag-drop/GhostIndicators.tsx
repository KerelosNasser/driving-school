'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Move, Eye } from 'lucide-react';
import { GhostDragEvent } from '../../lib/drag-drop/RealtimeDragDropSync';
import { DragItem, DropZone } from '../../lib/drag-drop';

interface GhostIndicatorsProps {
  ghosts: GhostDragEvent[];
  onGhostClick?: (ghost: GhostDragEvent) => void;
  className?: string;
}

export function GhostIndicators({ ghosts, onGhostClick, className = '' }: GhostIndicatorsProps) {
  const [visibleGhosts, setVisibleGhosts] = useState<GhostDragEvent[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter and sort ghosts by timestamp
    const activeGhosts = ghosts
      .filter(ghost => {
        const age = Date.now() - new Date(ghost.timestamp).getTime();
        return age < 10000; // Show ghosts for up to 10 seconds
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setVisibleGhosts(activeGhosts);
  }, [ghosts]);

  if (visibleGhosts.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={`ghost-indicators ${className}`}>
      {visibleGhosts.map((ghost) => (
        <GhostIndicator
          key={ghost.sessionId}
          ghost={ghost}
          onClick={() => onGhostClick?.(ghost)}
        />
      ))}
    </div>
  );
}

interface GhostIndicatorProps {
  ghost: GhostDragEvent;
  onClick?: () => void;
}

function GhostIndicator({ ghost, onClick }: GhostIndicatorProps) {
  const [position, setPosition] = useState(ghost.currentPosition);
  const [isVisible, setIsVisible] = useState(true);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ghost.currentPosition) {
      setPosition(ghost.currentPosition);
    }
  }, [ghost.currentPosition]);

  useEffect(() => {
    // Auto-hide after a delay
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [ghost.timestamp]);

  const getGhostColor = (userId: string): string => {
    // Generate a consistent color based on user ID
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  const ghostColor = getGhostColor(ghost.userId);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={indicatorRef}
      className="ghost-indicator"
      style={{
        position: 'absolute',
        left: position?.x || 0,
        top: position?.y || 0,
        zIndex: 1000,
        pointerEvents: onClick ? 'auto' : 'none'
      }}
      onClick={onClick}
    >
      {/* Ghost drag preview */}
      <div 
        className="ghost-drag-preview"
        style={{ borderColor: ghostColor }}
      >
        <div className="ghost-content">
          {ghost.item.preview?.icon && (
            <span className="ghost-icon">{ghost.item.preview.icon}</span>
          )}
          <span className="ghost-name">
            {ghost.item.preview?.name || ghost.item.componentType || 'Component'}
          </span>
        </div>
        
        {/* User indicator */}
        <div 
          className="ghost-user-indicator"
          style={{ backgroundColor: ghostColor }}
        >
          <User className="w-3 h-3" />
          <span className="ghost-user-name">{ghost.userName}</span>
        </div>
      </div>

      {/* Target zone indicator */}
      {ghost.targetZone && (
        <div className="ghost-target-indicator">
          <div 
            className="target-zone-highlight"
            style={{ borderColor: ghostColor }}
          >
            <Move className="w-4 h-4" />
            <span className="target-zone-name">
              {ghost.targetZone.type}: {ghost.targetZone.id}
            </span>
          </div>
        </div>
      )}

      {/* Connection line */}
      {ghost.targetZone && position && (
        <svg className="ghost-connection-line">
          <line
            x1={0}
            y1={0}
            x2={100}
            y2={50}
            stroke={ghostColor}
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.6"
          />
        </svg>
      )}
    </div>
  );
}

interface CollaborativeDragIndicatorProps {
  activeUsers: Array<{
    userId: string;
    userName: string;
    isDragging: boolean;
    dragItem?: DragItem;
    targetZone?: DropZone;
  }>;
  className?: string;
}

export function CollaborativeDragIndicator({ 
  activeUsers, 
  className = '' 
}: CollaborativeDragIndicatorProps) {
  const draggingUsers = activeUsers.filter(user => user.isDragging);

  if (draggingUsers.length === 0) {
    return null;
  }

  return (
    <div className={`collaborative-drag-indicator ${className}`}>
      <div className="indicator-header">
        <Eye className="w-4 h-4" />
        <span className="indicator-title">
          {draggingUsers.length} user{draggingUsers.length > 1 ? 's' : ''} dragging
        </span>
      </div>

      <div className="dragging-users">
        {draggingUsers.map((user) => (
          <div key={user.userId} className="dragging-user">
            <div className="user-info">
              <div className="user-avatar">
                {user.userName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.userName}</span>
            </div>
            
            {user.dragItem && (
              <div className="drag-item-info">
                <span className="drag-item-icon">
                  {user.dragItem.preview?.icon || '📦'}
                </span>
                <span className="drag-item-name">
                  {user.dragItem.preview?.name || user.dragItem.componentType}
                </span>
              </div>
            )}

            {user.targetZone && (
              <div className="target-zone-info">
                <Move className="w-3 h-3" />
                <span className="target-zone-text">
                  → {user.targetZone.type}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GhostIndicators;