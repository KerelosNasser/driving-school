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
  Loader2,
  AlertCircle,
  Target
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
  isBasicMode?: boolean;
}

export default function InvitationDashboard() {
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch invitation stats with fallback
  useEffect(() => {
    async function fetchStats() {
      try {
        const codeResponse = await fetch('/api/invitation/generate');
        const codeData = await codeResponse.json();
        
        if (codeResponse.ok && codeData.invitationCode) {
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
          
          setStats(basicStats);
        } else {
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
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm text-gray-600">Loading referral data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Referrals</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-6">
        <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting Up Referrals</h3>
        <p className="text-sm text-gray-600">Getting your referral code ready...</p>
      </div>
    );
  }

  const progressPercentage = stats.statistics.completedReferrals >= 3 ? 100 :
                            stats.statistics.completedReferrals >= 1 ? 66 :
                            stats.statistics.completedReferrals > 0 ? 33 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{stats.statistics.completedReferrals}</div>
          <div className="text-xs text-blue-100 flex items-center justify-center mt-1">
            <Users className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Referrals</span>
            <span className="sm:hidden">Refs</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-700 text-white p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{stats.statistics.unusedRewards}</div>
          <div className="text-xs text-emerald-100 flex items-center justify-center mt-1">
            <Gift className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Rewards</span>
            <span className="sm:hidden">Rews</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-700 text-white p-3 rounded-lg text-center">
          <div className="text-lg font-bold">
            {stats.statistics.completedReferrals >= 3 ? 'Done' : 
             stats.statistics.completedReferrals >= 1 ? '2h' : '30%'}
          </div>
          <div className="text-xs text-purple-100 flex items-center justify-center mt-1">
            <Target className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Goal</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-3 rounded-lg text-center">
          <div className="text-xl font-bold">{progressPercentage}%</div>
          <div className="text-xs text-orange-100 flex items-center justify-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Progress</span>
            <span className="sm:hidden">Prog</span>
          </div>
        </div>
      </div>

      {/* Compact Invitation Code Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <span>Your Code</span>
              {stats.isBasicMode && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  Basic
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription className="text-indigo-200 text-sm">
            Share to earn: 30% off (1 ref) • 2 free hours (3 refs)
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Code Display */}
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-mono text-sm font-bold text-center">
              {stats.invitationCode.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInvitationCode}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-2"
            >
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={shareInvitationCode}
              className="bg-white/20 hover:bg-white/30 text-white px-2"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Progress to next reward</span>
              <span>
                {stats.statistics.completedReferrals >= 3 ? 'Complete!' :
                 stats.statistics.completedReferrals >= 1 ? `${stats.statistics.completedReferrals}/3` :
                 `${stats.statistics.completedReferrals}/1`}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
              />
            </div>
          </div>

          {/* Usage Stats */}
          <div className="flex justify-between text-xs text-indigo-200">
            <span>Uses: {stats.invitationCode.currentUses} / {stats.invitationCode.maxUses || '∞'}</span>
            <span className="hidden sm:inline">
              Created {formatDistanceToNow(new Date(stats.invitationCode.createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Compact Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="overview" className="text-sm">
            Referrals ({stats.referrals.length})
          </TabsTrigger>
          <TabsTrigger value="rewards" className="text-sm">
            Rewards ({stats.rewards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Your Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.referrals.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No referrals yet</p>
                  <p className="text-xs mt-1">Share your code to start earning!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-blue-500 rounded-full">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{referral.referredUser.name}</p>
                          <p className="text-xs text-gray-600 hidden sm:block">{referral.referredUser.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs mb-1">Complete</Badge>
                        <p className="text-xs text-gray-500">
                          {format(new Date(referral.completedAt), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-600" />
                Your Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.rewards.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Gift className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rewards yet</p>
                  <p className="text-xs mt-1">Get 30% off after 1 referral!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.rewards.map((reward) => {
                    const rewardDisplay = getRewardDisplay(reward);
                    return (
                      <div
                        key={reward.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${rewardDisplay.color}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1 rounded-full">
                            {rewardDisplay.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{rewardDisplay.title}</p>
                            <p className="text-xs opacity-80">{rewardDisplay.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs mb-1">Available</Badge>
                          <p className="text-xs opacity-70">
                            Exp {format(new Date(reward.expiresAt), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}