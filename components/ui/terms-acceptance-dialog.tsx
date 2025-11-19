'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield ,ChevronDown, X } from 'lucide-react';

interface Term {
  id: string;
  title: string;
  content: string;
}

interface TermsAcceptanceDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const DEFAULT_TERMS: Term[] = [
  { id: '1', title: 'Booking and Payment', content: 'All lessons must be booked in advance. Payment is required at the time of booking. We accept all major credit cards and digital payment methods.' },
  { id: '2', title: 'Cancellation Policy', content: 'Lessons can be cancelled or rescheduled with at least 24 hours notice. Cancellations with less than 24 hours notice may incur a cancellation fee.' },
  { id: '3', title: 'Vehicle and Insurance', content: "All lessons are conducted in fully insured, dual-control vehicles. Students must hold a valid learner's permit or provisional license." },
  { id: '4', title: 'Instructor Policies', content: 'Our instructors are fully licensed and accredited. Lessons may be terminated early if unsafe behavior is observed.' },
  { id: '5', title: 'Liability and Safety', content: 'Students participate in driving lessons at their own risk. We maintain comprehensive insurance coverage, but students are responsible for damages from negligent behavior.' },
  { id: '6', title: 'Refund Policy', content: 'Refunds are available within 48 hours of booking, subject to our cancellation policy. Unused credits may be transferred but cannot be refunded after commencement of the first lesson.' }
];

export function TermsAcceptanceDialog({
  open,
  onAccept,
  onDecline
}: TermsAcceptanceDialogProps) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const response = await fetch('/api/content/persistent?page=packages&key=packages_terms_conditions');
        
        if (response.ok) {
          const data = await response.json();
          const item = Array.isArray(data.data)
            ? data.data.find((x: any) => x.content_key === 'packages_terms_conditions')
            : data.data;

          if (item && item.content_json && Array.isArray(item.content_json)) {
            setTerms(item.content_json);
          } else {
            setTerms(DEFAULT_TERMS);
          }
        } else {
          setTerms(DEFAULT_TERMS);
        }
      } catch (_error) {
        setTerms(DEFAULT_TERMS);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadTerms();
    }
  }, [open]);

  

  const handleAccept = () => {
    if (!accepted) return;
    onAccept();
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    const isScrolledToBottom = scrollPercentage >= 0.95; // 95% threshold
    setHasScrolledToBottom(isScrolledToBottom);
  };

  const toggleTerm = (termId: string) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  };

  

  const handleDecline = () => {
    setAccepted(false);
    onDecline();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="w-full max-w-none h-[100dvh] p-0 gap-0 overflow-hidden bg-white rounded-none md:rounded-2xl md:h-[85vh] md:max-w-3xl border-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="px-4 py-3 border-b bg-white sticky top-0 z-10 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Shield className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg md:text-xl font-bold text-gray-900">Terms & Conditions</DialogTitle>
              <p className="text-xs md:text-sm text-gray-500">Please review and accept to continue</p>
            </div>
            <div className={`text-xs px-2.5 py-1 rounded-full ${hasScrolledToBottom ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{hasScrolledToBottom ? 'Ready' : 'Scroll to end'}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-600 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 font-medium">Loading terms...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            

            {/* Terms Content with Custom Scroll */}
            <div className="flex-1 overflow-hidden">
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 #F1F5F9'
                }}
              >
                {terms.map((term, index) => {
                  const isExpanded = expandedTerms.has(term.id);
                  return (
                    <motion.div
                      key={term.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Term Header */}
                      <button
                        onClick={() => toggleTerm(term.id)}
                        className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white text-sm px-3 py-1.5 rounded-full font-semibold flex-shrink-0 shadow-sm">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base group-hover:text-yellow-700 transition-colors truncate">
                              {term.title}
                            </h3>
                            {!isExpanded && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {term.content.substring(0, 80)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className={`p-1 rounded-full transition-all duration-200 ${
                            isExpanded 
                              ? 'bg-yellow-100 text-yellow-600 rotate-180' 
                              : 'bg-gray-100 text-gray-500 group-hover:bg-yellow-50 group-hover:text-yellow-500'
                          }`}>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </button>
                      
                      {/* Term Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 border-t border-gray-100">
                              <div className="pt-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mt-2">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {term.content}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
                
                {/* Scroll Indicator */}
                {!hasScrolledToBottom && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="sticky bottom-0 flex justify-center pb-4"
                  >
                    <div className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
                      <ChevronDown className="h-4 w-4 animate-bounce" />
                      <span>Scroll to continue</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="border-t bg-white p-3 md:p-4 sticky bottom-0 z-10">
              {/* Acceptance Section */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <Checkbox
                    id="accept-terms"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked === true)}
                    className="border-2 border-gray-300 mt-0.5 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                  />
                  <label 
                    htmlFor="accept-terms" 
                    className="text-sm font-medium text-gray-900 cursor-pointer leading-relaxed flex-1"
                  >
                    I have carefully read, understood, and agree to be bound by all the Terms & Conditions outlined above. 
                    I acknowledge this constitutes a legally binding agreement.
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="flex-1 h-12 text-base border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline & Go Back
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={!accepted || !hasScrolledToBottom}
                    className={`flex-1 h-12 text-base font-semibold transition-all duration-300 ${
                      accepted && hasScrolledToBottom
                        ? 'bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    }`}
                  >
                    {!hasScrolledToBottom ? 'Scroll to the end' : !accepted ? 'Please accept the terms' : 'Accept & Continue'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}