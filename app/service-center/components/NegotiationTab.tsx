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
      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* New Message Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Contact Instructor</span>
          </CardTitle>
          <CardDescription>
            Send messages to your driving instructor for scheduling, questions, or special requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Compose New Message
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Instructor Email (Optional) */}
              <div>
                <Label htmlFor="instructor-email">emealghobrial@gmail.com</Label>
                <Input
                  id="instructor-email"
                  type="email"
                  placeholder="Leave blank to use default instructor email"
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left blank, the message will be sent to the main instructor email
                </p>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Schedule Change Request, Lesson Feedback, etc."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {subject.length}/200 characters
                </p>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here... Be specific about your request or question."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {messageText.length}/2000 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSendMessage}
                  disabled={!subject.trim() || !messageText.trim() || sending}
                  className="flex-1"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Message History</span>
          </CardTitle>
          <CardDescription>
            Your previous messages to instructors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages sent yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Send your first message to start communicating with your instructor
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{msg.subject}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(msg.status)}>
                        {getStatusIcon(msg.status)}
                        <span className="ml-1">{getStatusText(msg.status)}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>To: {msg.instructor_email}</span>
                    <span>{new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  
                  {msg.status === 'failed' && (
                    <Alert className="mt-3 border-red-300 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 text-sm">
                        Message delivery failed. Please try sending again or contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Communication Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be specific about your scheduling needs or questions</li>
                <li>• Include your preferred dates and times for lessons</li>
                <li>• Mention any special requirements or concerns</li>
                <li>• The instructor will reply directly to your email address</li>
                <li>• Allow 24-48 hours for a response</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}