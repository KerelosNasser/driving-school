'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEditMode } from '@/contexts/editModeContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Term {
  id: string;
  title: string;
  content: string;
}

interface EditableTermsConditionsProps {
  contentKey: string;
  page?: string;
  className?: string;
  defaultTerms?: Term[];
}

export function EditableTermsConditions({
  contentKey,
  page = 'packages',
  className = '',
  defaultTerms = []
}: EditableTermsConditionsProps) {
  const { isEditMode, isSaving } = useEditMode();
  const [terms, setTerms] = useState<Term[]>(defaultTerms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState({ title: '', content: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load terms from the database
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const response = await fetch(`/api/admin/content?page=${page}&key=${contentKey}`);
        
        if (response.ok) {
          const data = await response.json();
          const termsData = data.data.find((item: any) => item.content_key === contentKey);
          
          if (termsData && termsData.content_json && Array.isArray(termsData.content_json)) {
            setTerms(termsData.content_json);
          } else if (defaultTerms.length > 0) {
            setTerms(defaultTerms);
            await saveTerms(defaultTerms);
          }
        } else if (defaultTerms.length > 0) {
          setTerms(defaultTerms);
          await saveTerms(defaultTerms);
        }
      } catch (error) {
        if (defaultTerms.length > 0) {
          setTerms(defaultTerms);
        }
      }
    };

    loadTerms();
  }, [contentKey, page, defaultTerms]);

  // Save terms to database
  const saveTerms = async (newTerms: Term[]) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: contentKey,
          value: newTerms,
          type: 'json',
          page: page
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          setTerms(newTerms);
          toast.success('Terms updated successfully');
          return true;
        }
      }
      
      toast.error('Failed to save terms');
      return false;
    } catch (error) {
      toast.error('Failed to save terms');
      return false;
    }
  };

  const addTerm = async () => {
    if (!newTerm.title.trim() || !newTerm.content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    const newTermObj: Term = {
      id: `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newTerm.title.trim(),
      content: newTerm.content.trim()
    };

    const updatedTerms = [...terms, newTermObj];
    const success = await saveTerms(updatedTerms);
    
    if (success) {
      setNewTerm({ title: '', content: '' });
      setShowAddForm(false);
    }
  };

  const updateTerm = async (id: string, title: string, content: string) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content cannot be empty');
      return;
    }

    const updatedTerms = terms.map(term => 
      term.id === id ? { ...term, title: title.trim(), content: content.trim() } : term
    );
    
    const success = await saveTerms(updatedTerms);
    if (success) {
      setEditingId(null);
    }
  };

  const removeTerm = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
      return;
    }

    const updatedTerms = terms.filter(term => term.id !== id);
    const success = await saveTerms(updatedTerms);
    
    if (success) {
      toast.success('Term deleted successfully');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      x: -300,
      scale: 0.8,
      transition: { 
        duration: 0.3
      }
    }
  };

  return (
    <section className={cn("py-12 md:py-16 bg-gradient-to-br from-gray-50 to-gray-100", className)}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <motion.h2 
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Terms & Conditions
          </motion.h2>
          <motion.p 
            className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Please read and understand the following terms and conditions for our driving lesson services.
          </motion.p>
        </div>

        <motion.div
          className="space-y-4 md:space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {terms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                isEditing={editingId === term.id}
                onEdit={() => setEditingId(term.id)}
                onSave={(title, content) => updateTerm(term.id, title, content)}
                onCancel={() => setEditingId(null)}
                onDelete={() => removeTerm(term.id)}
                isEditMode={isEditMode}
                variants={itemVariants}
              />
            ))}
          </AnimatePresence>

          {/* Add New Term Form */}
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              {showAddForm ? (
                <Card className="p-4 md:p-6 border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter term title..."
                      value={newTerm.title}
                      onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })}
                      className="font-semibold text-sm md:text-base"
                    />
                    <Textarea
                      placeholder="Enter term description..."
                      value={newTerm.content}
                      onChange={(e) => setNewTerm({ ...newTerm, content: e.target.value })}
                      rows={3}
                      className="text-sm md:text-base"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={addTerm}
                        disabled={!newTerm.title.trim() || !newTerm.content.trim() || isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Add Term
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewTerm({ title: '', content: '' });
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setShowAddForm(true)}
                    variant="outline"
                    className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 py-6 md:py-8 text-sm md:text-base transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Term
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Individual Term Card Component
interface TermCardProps {
  term: Term;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  isEditMode: boolean;
  variants: any;
}

function TermCard({
  term,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isEditMode,
  variants
}: TermCardProps) {
  const [editTitle, setEditTitle] = useState(term.title);
  const [editContent, setEditContent] = useState(term.content);

  useEffect(() => {
    setEditTitle(term.title);
    setEditContent(term.content);
  }, [term, isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && editContent.trim()) {
      onSave(editTitle, editContent);
    }
  };

  return (
    <motion.div
      layout
      variants={variants}
      exit="exit"
      whileHover={{ y: -2 }}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300",
        isEditMode && "hover:shadow-lg hover:border-blue-300 cursor-pointer",
        isEditing && "border-blue-400 shadow-lg ring-2 ring-blue-100"
      )}
    >
      <div className="p-4 md:p-6">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-semibold text-base md:text-lg border-2 focus:border-blue-500"
              placeholder="Term title..."
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              placeholder="Term content..."
              className="border-2 focus:border-blue-500 text-sm md:text-base"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!editTitle.trim() || !editContent.trim()}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-none"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex-1 leading-tight">
                {term.title}
              </h3>
              {isEditMode && (
                <div className="flex gap-1 self-start">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={onEdit}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={onDelete}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              {term.content}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}