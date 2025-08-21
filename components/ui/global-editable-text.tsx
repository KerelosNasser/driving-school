'use client';

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { useEditMode } from '@/contexts/editModeContext';
import { useGlobalContent } from '@/contexts/globalContentContext';

interface GlobalEditableTextProps {
    contentKey: keyof import('@/contexts/globalContentContext').GlobalContent;
    tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'a';
    className?: string;
    placeholder?: string;
    multiline?: boolean;
    maxLength?: number;
    href?: string; // For anchor tags
    children?: ReactNode;
}

export function GlobalEditableText({
                                       contentKey,
                                       tagName = 'span',
                                       className = '',
                                       placeholder = 'Click to edit...',
                                       multiline = false,
                                       maxLength = 200,
                                       href,
                                       children
                                   }: GlobalEditableTextProps) {
    const { isEditMode, isSaving } = useEditMode();
    const { content, updateGlobalContent } = useGlobalContent();
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState('');
    const editRef = useRef<HTMLElement>(null);

    // Get the current value from global content
    const currentValue = content[contentKey] || children?.toString() || '';

    useEffect(() => {
        setText(currentValue.toString());
    }, [currentValue]);

    const handleClick = (e: React.MouseEvent) => {
        if (!isEditMode || isSaving) return;
        if (tagName === 'a') e.preventDefault(); // Prevent navigation when editing links

        setIsEditing(true);
        setTimeout(() => {
            if (editRef.current) {
                editRef.current.innerText = text;
                editRef.current.focus();
                // Select all text
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(editRef.current);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }, 10);
    };

    const handleBlur = async () => {
        if (!isEditing || !editRef.current) return;
        const finalValue = editRef.current.innerText.trim();
        setIsEditing(false);

        if (finalValue !== '' && finalValue !== text) {
            setText(finalValue);
            await updateGlobalContent(contentKey, finalValue);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            editRef.current?.blur();
        } else if (e.key === 'Escape') {
            if (editRef.current) {
                editRef.current.innerText = text;
            }
            editRef.current?.blur();
        }
    };

    const handleInput = () => {
        if (editRef.current) {
            const newValue = editRef.current.innerText;
            if (newValue.length > maxLength) {
                const truncated = newValue.substring(0, maxLength);
                editRef.current.innerText = truncated;
                // Move cursor to end
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(editRef.current);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    };

    const Tag = tagName as any;
    const isLink = tagName === 'a';

    const baseProps = {
        ref: editRef,
        className: cn(
            className,
            isEditMode && 'global-editable-element cursor-pointer transition-all duration-200',
            isEditing && 'editing'
        ),
        onClick: handleClick,
        ...(isLink && !isEditMode && href ? { href } : {}),
        ...(isEditing ? {
            contentEditable: true,
            suppressContentEditableWarning: true,
            onBlur: handleBlur,
            onKeyDown: handleKeyDown,
            onInput: handleInput,
            'data-placeholder': placeholder,
            style: {
                minHeight: '1.5em',
                outline: '2px solid #3b82f6',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }
        } : {})
    };

    if (!isEditMode) {
        return <Tag {...baseProps}>{currentValue}</Tag>;
    }

    return (
        <>
            <Tag {...baseProps}>
                {isEditing ? null : currentValue}
            </Tag>
            {isEditMode && (
                <style jsx global>{`
          .global-editable-element:hover {
            background-color: rgba(59, 130, 246, 0.05);
            border-radius: 4px;
            padding: 2px 4px;
          }
          .global-editable-element.editing:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            font-style: italic;
          }
        `}</style>
            )}
        </>
    );
}

// Convenience components for common global content
export function BusinessPhone({ className = '', tagName = 'span' as any }) {
    return (
        <GlobalEditableText
            contentKey="business_phone"
            tagName={tagName}
            className={className}
            placeholder="Enter phone number..."
        />
    );
}

export function BusinessEmail({ className = '', tagName = 'span' as any }) {
    return (
        <GlobalEditableText
            contentKey="business_email"
            tagName={tagName}
            className={className}
            placeholder="Enter email address..."
        />
    );
}

export function InstructorName({ className = '', tagName = 'span' as any }) {
    return (
        <GlobalEditableText
            contentKey="instructor_name"
            tagName={tagName}
            className={className}
            placeholder="Enter instructor name..."
        />
    );
}

export function BusinessName({ className = '', tagName = 'span' as any }) {
    return (
        <GlobalEditableText
            contentKey="business_name"
            tagName={tagName}
            className={className}
            placeholder="Enter business name..."
        />
    );
}

export function BusinessAddress({ className = '', tagName = 'span' as any }) {
    return (
        <GlobalEditableText
            contentKey="business_address"
            tagName={tagName}
            className={className}
            placeholder="Enter business address..."
            multiline={true}
        />
    );
}