'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, FileText, AlertCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

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

  // Load terms from the database
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const response = await fetch('/api/admin/content?page=packages&key=packages_terms_conditions');
        
        if (response.ok) {
          const data = await response.json();
          const termsData = data.data.find((item: any) => item.content_key === 'packages_terms_conditions');
          
          if (termsData && termsData.content_json && Array.isArray(termsData.content_json)) {
            setTerms(termsData.content_json);
          } else {
            // Fallback to default terms if none found
            setTerms(defaultTerms);
          }
        } else {
          setTerms(defaultTerms);
        }
      } catch (error) {
        console.error('Error loading terms:', error);
        setTerms(defaultTerms);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadTerms();
    }
  }, [open]);

  const defaultTerms: Term[] = [
    {
      id: '1',
      title: 'Booking and Payment',
      content: 'All lessons must be booked in advance. Payment is required at the time of booking. We accept all major credit cards and digital payment methods.'
    },
    {
      id: '2',
      title: 'Cancellation Policy',
      content: 'Lessons can be cancelled or rescheduled with at least 24 hours notice. Cancellations with less than 24 hours notice may incur a cancellation fee.'
    },
    {
      id: '3',
      title: 'Vehicle and Insurance',
      content: 'All lessons are conducted in fully insured, dual-control vehicles. Students must hold a valid learner\'s permit or provisional license.'
    },
    {
      id: '4',
      title: 'Instructor Policies',
      content: 'Our instructors are fully licensed and accredited. Lessons may be terminated early if the student is under the influence of alcohol or drugs, or exhibits unsafe behavior.'
    },
    {
      id: '5',
      title: 'Liability and Safety',
      content: 'Students participate in driving lessons at their own risk. We maintain comprehensive insurance coverage, but students are responsible for any damages resulting from negligent or reckless behavior.'
    },
    {
      id: '6',
      title: 'Refund Policy',
      content: 'Refunds are available within 48 hours of booking, subject to our cancellation policy. Unused lesson credits may be transferred but cannot be refunded after the commencement of the first lesson.'
    }
  ];

  const handleAccept = () => {
    if (!accepted) return;
    onAccept();
  };

  const handleDecline = () => {
    setAccepted(false);
    onDecline();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="w-[95vw] max-w-4xl h-[95vh] max-h-[800px] p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('/api/placeholder/800/200')] opacity-5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 rounded-full translate-y-12 -translate-x-12 opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Terms & Conditions
                  </DialogTitle>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Please read and accept our terms to continue
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-300 ${
                hasScrolledToBottom 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <CheckCircle2 className={`h-3 w-3 transition-colors ${
                  hasScrolledToBottom ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span>{hasScrolledToBottom ? 'Review Complete' : 'Please Review All Terms'}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Loading terms...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Terms List */}
              <ScrollArea 
                className="flex-1 p-4 sm:p-6" 
                onScrollCapture={handleScroll}
              >
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600">
                      Please review all {terms.length} terms below. You can tap each term to expand it.
                    </p>
                  </div>
                  
                  {terms.map((term, index) => {
                    const isExpanded = expandedTerms.has(term.id);
                    return (
                      <motion.div
                        key={term.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {/* Term Header */}
                        <button
                          onClick={() => toggleTerm(term.id)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-blue-100 text-blue-700 text-xs sm:text-sm px-2 py-1 rounded-full font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {term.title}
                            </h3>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </button>
                        
                        {/* Term Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 border-t border-gray-100">
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                  {term.content}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t bg-gray-50 p-4 sm:p-6 space-y-4">
                {/* Important Notice */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-amber-800 font-medium">
                        Important Notice
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        By accepting these terms, you agree to comply with all policies. 
                        You must accept to proceed with booking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acceptance Checkbox */}
                <div className="flex items-start space-x-3 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                  <Checkbox
                    id="accept-terms"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked === true)}
                    className="border-2 border-gray-300 mt-0.5 flex-shrink-0"
                  />
                  <label 
                    htmlFor="accept-terms" 
                    className="text-xs sm:text-sm font-medium text-gray-900 cursor-pointer select-none leading-relaxed flex-1"
                  >
                    I have carefully read, understood, and agree to be bound by all the Terms & Conditions outlined above
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                  >
                    Decline & Go Back
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={!accepted || !hasScrolledToBottom}
                    className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-300 transform ${
                      accepted && hasScrolledToBottom
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl hover:scale-[1.02] text-white'
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    }`}
                  >
                    {!hasScrolledToBottom ? (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2 animate-bounce" />
                        Review All Terms First
                      </>
                    ) : !accepted ? (
                      'Please Accept Terms'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept & Continue to Booking
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}