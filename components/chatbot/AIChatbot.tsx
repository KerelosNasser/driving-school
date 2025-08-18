'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';
import {ChatbotProps, Message} from "@/lib/types";


export function AIChatbot({ delayMs = 5000 }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isLoaded } = useUser();

  // Persist chat history in localStorage
  const STORAGE_KEY = 'driving-school-chat-history';

  // Load chat history on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          // Convert timestamp strings back to Date objects
          const historyWithDates = parsedHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(historyWithDates);
          setHasGreeted(true); // Don't show greeting if history exists
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Show chatbot after delay with enhanced notification
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Add extra attention-grabbing animation
      setTimeout(() => setShowPulse(true), 1000);
      // Remove pulse after 10 seconds unless user interacts
      setTimeout(() => {
        if (!hasInteracted) setShowPulse(false);
      }, 10000);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, hasInteracted]);

  // Enhanced auto-scroll to bottom with better smooth behavior
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    };

    // Slight delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  // Initial greeting when chatbot opens (only if no history)
  useEffect(() => {
    if (isOpen && !hasGreeted && isLoaded && messages.length === 0) {
      setHasInteracted(true);
      const greeting = user 
        ? `Hi ${user.firstName || 'there'}! 🚗 I'm your EG Driving School AI assistant. How can I help you today?`
        : "Hello! 🚗 I'm your EG Driving School AI assistant with comprehensive knowledge about our packages, services, booking system, and more. I can help you with everything from choosing the right package to checking availability. How can I assist you today?";
      
      setMessages([{
        id: '1',
        content: greeting,
        sender: 'bot',
        timestamp: new Date()
      }]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, user, isLoaded, messages.length]);

  const handleChatbotOpen = () => {
    setIsOpen(true);
    setShowPulse(false);
    setHasInteracted(true);
  };

  const clearChatHistory = () => {
    setMessages([]);
    setHasGreeted(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Add fresh greeting
    const greeting = user 
      ? `Hi ${user.firstName || 'there'}! 🚗 I'm your EG Driving School AI assistant. How can I help you today?`
      : "Hello! 🚗 I'm your EG Driving School AI assistant with comprehensive knowledge about our packages, services, booking system, and more. How can I assist you today?";
    
    setMessages([{
      id: Date.now().toString(),
      content: greeting,
      sender: 'bot',
      timestamp: new Date()
    }]);
    setHasGreeted(true);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          userId: user?.id,
          conversationHistory: messages.slice(-10) // Increased context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again or contact us directly at info@brisbanedrivingschool.com or 0400 000 000.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Enhanced Chatbot Toggle Button with Multiple Attention-Grabbing Effects */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 sm:bottom-16 sm:right-16"
          >
            {/* Pulsing Background Ring */}
            {showPulse && (
              <motion.div
                className="absolute inset-0 rounded-full bg-yellow-400"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
            {showPulse && (
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </motion.div>
            )}

            <motion.div
              animate={showPulse ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0 0 rgba(234, 179, 8, 0.7)",
                  "0 0 0 20px rgba(234, 179, 8, 0)",
                  "0 0 0 0 rgba(234, 179, 8, 0.7)"
                ]
              } : {}}
              transition={{
                duration: 2,
                repeat: showPulse ? Infinity : 0,
                ease: "easeOut"
              }}
            >
              <Button
                onClick={handleChatbotOpen}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-2xl border-2 border-white relative overflow-hidden"
                size="icon"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  animate={{
                    x: [-100, 100],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 relative z-10" />
              </Button>
            </motion.div>
            
            {/* Tooltip - hidden on mobile for better UX */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-16 -left-32 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-gray-700 hidden sm:block"
            >
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">AI Assistant Ready!</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Ask me about packages, bookings & more
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Mobile-Responsive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:bottom-6 sm:right-6 sm:top-auto sm:left-auto z-50 sm:w-96 sm:h-[600px] flex"
          >
            <Card className="w-full h-full flex flex-col shadow-2xl border-2 border-yellow-200">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-t-lg p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Bot className="h-6 w-6" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-lg">Brisbane Driving School</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-yellow-100 text-xs">EG AI Assistant • Online </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {messages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearChatHistory}
                        className="text-white hover:bg-yellow-700 h-8 w-8"
                        title="Clear chat history"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-yellow-700 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start gap-2 ${
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' 
                          : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 opacity-70`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-4 bg-white flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about driving lessons..."
                      disabled={isLoading}
                      className="flex-1 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                     EG your helper • For urgent matters, call 0400 000 000
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}