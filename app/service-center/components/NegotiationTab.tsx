'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Mail, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface InstructorMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  instructor_email: string;
  status: 'sent' | 'delivered' | 'failed';
  created_at: string;
}

export default function NegotiationTab() {
  const [messages, setMessages] = useState<InstructorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [instructorEmail, setInstructorEmail] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quota/messages');
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!subject.trim() || !messageText.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (subject.length > 200) {
      setError('Subject must be 200 characters or less');
      return;
    }

    if (messageText.length > 2000) {
      setError('Message must be 2000 characters or less');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/quota/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: messageText.trim(),
          instructor_email: instructorEmail.trim() || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Message sent successfully! The instructor will receive your message via email.');
        setSubject('');
        setMessageText('');
        setInstructorEmail('');
        setShowForm(false);
        
        // Refresh messages
        fetchMessages();
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      default:
        return 'Sent';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 rounded-xl">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-emerald-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* Message Composer */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <CardTitle className="flex items-center space-x-3 text-xl font-bold">
            <div className="p-2 bg-white/20 rounded-full">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span>Contact Instructor</span>
          </CardTitle>
          <CardDescription className="text-emerald-100">
            Send messages for scheduling, questions, or special requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-semibold rounded-xl shadow-lg">
              <Send className="h-5 w-5 mr-3" />
              Compose New Message
            </Button>
          ) : (
            <div className="space-y-6">
              {/* Instructor Email */}
              <div className="space-y-2">
                <Label htmlFor="instructor-email" className="text-sm font-semibold text-gray-700">Instructor Email (Optional)</Label>
                <Input
                  id="instructor-email"
                  type="email"
                  placeholder="emealghobrial@gmail.com (default)"
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">
                  Leave blank to use the default instructor email
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Schedule Change Request, Lesson Feedback"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  className="h-12 rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Be specific about your request</span>
                  <span>{subject.length}/200</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-gray-700">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here... Include dates, times, and specific details."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  className="rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Be clear and detailed</span>
                  <span>{messageText.length}/2000</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleSendMessage}
                  disabled={!subject.trim() || !messageText.trim() || sending}
                  className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl font-semibold shadow-lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setSubject('');
                    setMessageText('');
                    setInstructorEmail('');
                    setError(null);
                  }}
                  disabled={sending}
                  className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message History */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-700 text-white">
          <CardTitle className="flex items-center space-x-3 text-xl font-bold">
            <div className="p-2 bg-white/20 rounded-full">
              <Mail className="h-5 w-5" />
            </div>
            <span>Message History</span>
          </CardTitle>
          <CardDescription className="text-teal-100">
            Your previous messages to instructors
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
              <span className="text-gray-600 font-medium">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
              <p className="text-gray-500">
                Send your first message to start communicating with your instructor
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">{msg.subject}</h4>
                    <Badge className={`${getStatusColor(msg.status)} px-3 py-1 rounded-full font-medium`}>
                      {getStatusIcon(msg.status)}
                      <span className="ml-2">{getStatusText(msg.status)}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <span className="font-medium">To: {msg.instructor_email}</span>
                    <span>{new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  
                  {msg.status === 'failed' && (
                    <Alert className="mt-4 border-red-200 bg-red-50 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="text-red-800 font-medium">
                        Message delivery failed. Please try sending again or contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-500 rounded-full flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-4 text-lg">Communication Tips</h4>
              <div className="grid gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-emerald-800 font-medium">Be specific about your scheduling needs or questions</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-emerald-800 font-medium">Include your preferred dates and times for lessons</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-emerald-800 font-medium">Mention any special requirements or concerns</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-emerald-800 font-medium">The instructor will reply directly to your email address</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-emerald-800 font-medium">Allow 24-48 hours for a response</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}