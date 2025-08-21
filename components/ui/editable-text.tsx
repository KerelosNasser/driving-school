'use client';

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import {useEditMode} from "@/contexts/editModeContext";

interface EditableTextProps {
    children: ReactNode;
    contentKey: string;
    tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
    className?: string;
    placeholder?: string;
    multiline?: boolean;
    maxLength?: number;
}

export function EditableText({
                                 children,
                                 contentKey,
                                 tagName = 'div',
                                 className = '',
                                 placeholder = 'Click to edit...',
                                 multiline = false,
                                 maxLength = 500
                             }: EditableTextProps) {
    const { isEditMode, saveContent, isSaving } = useEditMode();
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(children?.toString() || '');
    const editRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isEditing) {
            setText(children?.toString() || '');
        }
    }, [children, isEditing]);

    const handleClick = () => {
        if (!isEditMode || isSaving) return;
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
            await saveContent(contentKey, finalValue);
        } else if (finalValue === '') {
            // Revert to previous text on re-render
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

    const Tag = tagName;

    if (!isEditMode) {
        return <Tag className={className}>{children}</Tag>;
    }

    return (
        <Tag
            ref={editRef}
            className={cn(
                className,
                'editable-element',
                isEditing ? 'editing' : '',
                'cursor-pointer transition-all duration-200'
            )}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onClick={handleClick}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            data-placeholder={placeholder}
            dir="ltr"
            style={{
                minHeight: isEditing ? '1.5em' : 'auto',
                outline: isEditing ? '2px solid #3b82f6' : 'none',
                padding: isEditing ? '4px 8px' : '0',
                borderRadius: isEditing ? '4px' : '0',
                backgroundColor: isEditing ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            }}
        >
            {isEditing ? null : text}
            {isEditing && (
                <style jsx>{`
                `}</style>
            )}
        </Tag>
    );
}