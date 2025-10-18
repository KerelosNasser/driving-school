'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Send, 
  Eye, 
  Clock, 
  Users, 
  Mail, 
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AnnouncementHistory {
  id: string;
  subject: string;
  content: string;
  recipient_count: number;
  sent_at: string;
  status: 'sent' | 'scheduled' | 'failed';
  scheduled_for?: string;
}

export function AnnouncementTab() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [history, setHistory] = useState<AnnouncementHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch user count and announcement history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user count
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUserCount(usersData.users?.length || 0);
        }

        // Fetch announcement history
        const historyResponse = await fetch('/api/admin/announcements/history');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData.announcements || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSendAnnouncement = async (scheduled = false) => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Please fill in both subject and content');
      return;
    }

    if (scheduled && !scheduledDate) {
      toast.error('Please select a date for scheduled sending');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/announcements/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          content,
          scheduled: scheduled,
          scheduledFor: scheduled ? scheduledDate?.toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send announcement');
      }

      const result = await response.json();
      
      if (scheduled) {
        toast.success(`Announcement scheduled for ${format(scheduledDate!, 'PPP')}`, {
          description: `Will be sent to ${userCount} users`,
        });
      } else {
        toast.success('Announcement sent successfully!', {
          description: `Sent to ${result.recipientCount || userCount} users`,
        });
      }

      // Clear form
      setSubject('');
      setContent('');
      setScheduledDate(undefined);
      
      // Refresh history
      const historyResponse = await fetch('/api/admin/announcements/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.announcements || []);
      }

    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error('Failed to send announcement', {
        description: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewHtml = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">EG Driving School</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Important Announcement</p>
        </div>
        <div style="padding: 30px 20px; background-color: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">${subject}</h2>
          <div style="font-size: 16px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${content}</div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: white; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              If you have any questions, please don't hesitate to contact us:<br>
              📞 Phone: 0400 000 000<br>
              📧 Email: info@egdrivingschool.com
            </p>
          </div>
        </div>
        <div style="background-color: #1f2937; color: #9ca3af; padding: 15px 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">&copy; 2025 EG Driving School. All rights reserved.</p>
        </div>
      </div>
    `;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Send important updates to all registered users</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{userCount} registered users</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Announcement */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Compose Announcement</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Subject Line
              </label>
              <Input
                placeholder="Enter announcement subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Message Content
              </label>
              <Textarea
                placeholder="Write your announcement message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length}/1000 characters
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Schedule (Optional)
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                className="flex-1"
                disabled={!subject.trim() || !content.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              {scheduledDate && (
                <Button
                  onClick={() => handleSendAnnouncement(true)}
                  disabled={isLoading || !subject.trim() || !content.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4 mr-2" />
                  )}
                  Schedule
                </Button>
              )}

              <Button
                onClick={() => handleSendAnnouncement(false)}
                disabled={isLoading || !subject.trim() || !content.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Announcement History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-500 h-32 flex items-center justify-center">
                  No announcements sent yet
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((announcement) => (
                    <div key={announcement.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {announcement.subject}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {announcement.content}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span>{announcement.recipient_count} recipients</span>
                            <span>{format(new Date(announcement.sent_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="ml-2 flex items-center space-x-1">
                          {getStatusIcon(announcement.status)}
                          <Badge 
                            variant={
                              announcement.status === 'sent' ? 'default' :
                              announcement.status === 'scheduled' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {announcement.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                ×
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="p-4">
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}