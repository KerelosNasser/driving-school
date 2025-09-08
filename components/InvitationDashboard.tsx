'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Users, 
  Gift, 
  Clock, 
  Percent, 
  Share2, 
  TrendingUp,
  ExternalLink,
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';

interface InvitationStats {
  invitationCode: {
    code: string;
    currentUses: number;
    maxUses: number | null;
    isActive: boolean;
    createdAt: string;
  };
  statistics: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewards: number;
    unusedRewards: number;
  };
  referrals: Array<{
    id: string;
    referredUser: {
      name: string;
      email: string;
    };
    completedAt: string;
    createdAt: string;
  }>;
  rewards: Array<{
    id: string;
    type: string;
    value: number;
    expiresAt: string;
    createdAt: string;
  }>;
}

export default function InvitationDashboard() {
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invitation stats with fallback
  useEffect(() => {
    async function fetchStats() {
      try {
        // Try to get user's invitation code first
        const codeResponse = await fetch('/api/invitation/generate');
        const codeData = await codeResponse.json();
        
        if (codeResponse.ok && codeData.invitationCode) {
          // Create basic stats structure with the encrypted code
          const basicStats = {
            invitationCode: {
              code: codeData.invitationCode,
              currentUses: 0,
              maxUses: null,
              isActive: true,
              createdAt: new Date().toISOString()
            },
            statistics: {
              totalReferrals: 0,
              completedReferrals: 0,
              pendingReferrals: 0,
              totalRewards: 0,
              unusedRewards: 0
            },
            referrals: [],
            rewards: [],
            isBasicMode: true
          };
          
          // Try to get full stats from the invitation system
          try {
            const response = await fetch('/api/invitation/stats');
            if (response.ok) {
              const data = await response.json();
              setStats(data);
              return;
            }
          } catch (statsError) {
            console.info('Full invitation stats not available, using basic mode');
          }
          
          // Use basic stats
          setStats(basicStats);
        } else {
          // No invitation code available
          setStats(null);
        }
      } catch (err) {
        console.warn('Invitation system not available:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Copy invitation code to clipboard
  const copyInvitationCode = async () => {
    if (!stats?.invitationCode?.code) return;

    try {
      await navigator.clipboard.writeText(stats.invitationCode.code);
      setCopiedCode(true);
      toast.success('Invitation code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast.error('Failed to copy invitation code');
    }
  };

  // Share invitation code
  const shareInvitationCode = async () => {
    if (!stats?.invitationCode?.code) return;

    const shareText = `Join our driving school with my invitation code: ${stats.invitationCode.code}`;
    const shareUrl = `${window.location.origin}?invite=${stats.invitationCode.code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Our Driving School',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success('Invitation link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to share invitation code');
      }
    }
  };

  const getRewardDisplay = (reward: any) => {
    switch (reward.type) {
      case 'discount_30_percent':
        return {
          icon: <Percent className="h-4 w-4" />,
          title: '30% Discount',
          description: 'Off your next booking',
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case 'free_hours_2':
        return {
          icon: <Clock className="h-4 w-4" />,
          title: '2 Free Hours',
          description: 'Driving lessons',
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      default:
        return {
          icon: <Gift className="h-4 w-4" />,
          title: 'Reward',
          description: 'Unknown reward type',
          color: 'text-gray-600 bg-gray-50 border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-2">
            <Gift className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load invitation dashboard</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Gift className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Program</h3>
          <p className="text-gray-600 mb-4">Getting your invitation code ready...</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="space-y-2 mt-4">
            <p className="text-sm text-gray-500">Coming soon:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>Encrypted invitation codes</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>Earn 30% discount after 1 referral</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>Get 2 free hours after 3 referrals</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.statistics.completedReferrals}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rewards</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.statistics.unusedRewards}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Next Milestone</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.statistics.completedReferrals >= 3 ? '✓' : 
                     stats.statistics.completedReferrals >= 1 ? '2 Hours' : '30% Off'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Invitation Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Encrypted Invitation Code
              {stats.isBasicMode && (
                <Badge variant="secondary" className="text-xs ml-2">
                  Basic Mode
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {stats.invitationCode.code.startsWith('DRV') ? (
                'Share this secure, encrypted code with friends to earn rewards! Get a 30% discount after 1 referral, and 2 free hours after 3 referrals.'
              ) : (
                'Share this code with friends to earn rewards! Get a 30% discount after 1 referral, and 2 free hours after 3 referrals.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-3 bg-gray-50 border rounded-lg font-mono text-lg tracking-wider font-bold">
                {stats.invitationCode.code}
              </code>
              <Button
                variant="outline"
                onClick={copyInvitationCode}
                className="flex items-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                onClick={shareInvitationCode}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Uses: {stats.invitationCode.currentUses} / {stats.invitationCode.maxUses || '∞'}</span>
              <span>Created {formatDistanceToNow(new Date(stats.invitationCode.createdAt), { addSuffix: true })}</span>
            </div>

            {/* Progress towards next reward */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress to next reward</span>
                <span>
                  {stats.statistics.completedReferrals >= 3 ? 'All rewards unlocked!' :
                   stats.statistics.completedReferrals >= 1 ? `${stats.statistics.completedReferrals}/3 for 2 free hours` :
                   `${stats.statistics.completedReferrals}/1 for 30% discount`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: stats.statistics.completedReferrals >= 3 ? '100%' :
                           stats.statistics.completedReferrals >= 1 ? '66%' :
                           `${(stats.statistics.completedReferrals / 1) * 33}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                People who have signed up using your invitation code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.referrals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No referrals yet</p>
                  <p className="text-sm mt-1">Share your invitation code to start earning rewards!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.referrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-full">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.referredUser.name}</p>
                          <p className="text-sm text-gray-600">{referral.referredUser.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Completed</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(referral.completedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Your Rewards</CardTitle>
              <CardDescription>
                Rewards you've earned from successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.rewards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No rewards yet</p>
                  <p className="text-sm mt-1">Get your first reward after 1 successful referral!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.rewards.map((reward, index) => {
                    const rewardDisplay = getRewardDisplay(reward);
                    return (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${rewardDisplay.color}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full">
                            {rewardDisplay.icon}
                          </div>
                          <div>
                            <p className="font-medium">{rewardDisplay.title}</p>
                            <p className="text-sm opacity-80">{rewardDisplay.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">Available</Badge>
                          <p className="text-xs opacity-70">
                            Expires {format(new Date(reward.expiresAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
