'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Award,
  DollarSign,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TableBody, TableCell,TableHeader, TableRow,Table, TableHead } from '@/components/ui/table';

interface RewardTier {
  id: string;
  tier_name: string;
  required_referrals: number;
  reward_type: 'discount' | 'free_package';
  reward_value: number;
  package_id?: string;
  is_active: boolean;
  created_at: string;
}

interface UserReward {
  id: string;
  user_id: string;
  reward_type: 'discount' | 'free_package';
  reward_value: number;
  package_id?: string;
  is_used: boolean;
  used_at?: string;
  earned_at: string;
  expires_at?: string;
  source: 'referral' | 'admin_gift';
  users: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  packages?: {
    name: string;
    price: number;
  };
}

interface ReferralStats {
  total_users: number;
  total_referrals: number;
  total_rewards_distributed: number;
  total_rewards_used: number;
  total_discount_value: number;
  active_reward_tiers: number;
}

interface Package {
  id: string;
  name: string;
  price: number;
}

export function ReferralRewardsTab() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Dialog states
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);

  // Form states
  const [tierForm, setTierForm] = useState({
    tier_name: '',
    required_referrals: 1,
    reward_type: 'discount' as 'discount' | 'free_package',
    reward_value: 10,
    package_id: '',
    is_active: true
  });

  const [giftForm, setGiftForm] = useState({
    recipient_user_id: '',
    reward_type: 'discount' as 'discount' | 'free_package',
    reward_value: 10,
    package_id: '',
    reason: '',
    expires_at: '',
    notify_user: true
  });

  // Fetch data functions
  const fetchRewardTiers = async () => {
    try {
      const response = await fetch('/api/admin/referral-rewards/tiers');
      if (response.ok) {
        const data = await response.json();
        setRewardTiers(data.tiers || []);
      }
    } catch (error) {
      console.error('Error fetching reward tiers:', error);
    }
  };

  const fetchUserRewards = async () => {
    try {
      const response = await fetch('/api/admin/referral-rewards/rewards');
      if (response.ok) {
        const data = await response.json();
        setUserRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error fetching user rewards:', error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/admin/referral-rewards/stats');
      if (response.ok) {
        const data = await response.json();
        setReferralStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchRewardTiers();
    fetchUserRewards();
    fetchReferralStats();
    fetchPackages();
    fetchUsers();
  }, []);

  // Handle tier creation/update
  const handleSaveTier = async () => {
    setLoading(true);
    try {
      const url = editingTier 
        ? `/api/admin/referral-rewards/tiers?id=${editingTier.id}`
        : '/api/admin/referral-rewards/tiers';
      
      const method = editingTier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tierForm)
      });

      if (response.ok) {
        toast.success(editingTier ? 'Reward tier updated successfully' : 'Reward tier created successfully');
        setShowTierDialog(false);
        setEditingTier(null);
        setTierForm({
          tier_name: '',
          required_referrals: 1,
          reward_type: 'discount',
          reward_value: 10,
          package_id: '',
          is_active: true
        });
        fetchRewardTiers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save reward tier');
      }
    } catch (error) {
      toast.error('An error occurred while saving the reward tier'+error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tier deletion
  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this reward tier?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/referral-rewards/tiers?id=${tierId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Reward tier deleted successfully');
        fetchRewardTiers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete reward tier');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the reward tier'+error);
    } finally {
      setLoading(false);
    }
  };

  // Handle gift reward
  const handleGiftReward = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/referral-rewards/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giftForm)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Reward gifted successfully');
        setShowGiftDialog(false);
        setGiftForm({
          recipient_user_id: '',
          reward_type: 'discount',
          reward_value: 10,
          package_id: '',
          reason: '',
          expires_at: '',
          notify_user: true
        });
        fetchUserRewards();
        fetchReferralStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to gift reward');
      }
    } catch (error) {
      toast.error('An error occurred while gifting the reward'+error);
    } finally {
      setLoading(false);
    }
  };

  // Edit tier handler
  const handleEditTier = (tier: RewardTier) => {
    setEditingTier(tier);
    setTierForm({
      tier_name: tier.tier_name,
      required_referrals: tier.required_referrals,
      reward_type: tier.reward_type,
      reward_value: tier.reward_value,
      package_id: tier.package_id || '',
      is_active: tier.is_active
    });
    setShowTierDialog(true);
  };

  // Handle manual reward distribution
  const handleDistributeRewards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/referral-rewards/distribute', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Rewards distributed successfully');
        fetchUserRewards();
        fetchReferralStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to distribute rewards');
      }
    } catch (error) {
      toast.error('An error occurred while distributing rewards');
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleDistributeRewards}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Distributing...' : 'Distribute Rewards to All Users'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.total_referrals || 0}</div>
            <p className="text-xs text-muted-foreground">Successful referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Distributed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.total_rewards_distributed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {referralStats?.total_rewards_used || 0} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${referralStats?.total_discount_value || 0}</div>
            <p className="text-xs text-muted-foreground">Total savings provided</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rewards</CardTitle>
          <CardDescription>Latest reward distributions and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userRewards.slice(0, 5).map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    reward.reward_type === 'discount' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {reward.reward_type === 'discount' ? <DollarSign className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{reward.users.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {reward.reward_type === 'discount' 
                        ? `${reward.reward_value}% discount` 
                        : `Free ${reward.packages?.name || 'package'}`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={reward.is_used ? 'secondary' : 'default'}>
                    {reward.is_used ? 'Used' : 'Available'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(reward.earned_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTiersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Reward Tiers</h3>
          <p className="text-sm text-muted-foreground">Configure referral milestones and rewards</p>
        </div>
        <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTier(null);
              setTierForm({
                tier_name: '',
                required_referrals: 1,
                reward_type: 'discount',
                reward_value: 10,
                package_id: '',
                is_active: true
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTier ? 'Edit Reward Tier' : 'Create Reward Tier'}</DialogTitle>
              <DialogDescription>
                Set up referral milestones and corresponding rewards for users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tier_name" className="text-right">Name</Label>
                <Input
                  id="tier_name"
                  value={tierForm.tier_name}
                  onChange={(e) => setTierForm({ ...tierForm, tier_name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Bronze Tier"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="required_referrals" className="text-right">Referrals</Label>
                <Input
                  id="required_referrals"
                  type="number"
                  min="1"
                  value={tierForm.required_referrals}
                  onChange={(e) => setTierForm({ ...tierForm, required_referrals: parseInt(e.target.value) || 1 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reward_type" className="text-right">Type</Label>
                <Select
                  value={tierForm.reward_type}
                  onValueChange={(value: 'discount' | 'free_package') => 
                    setTierForm({ ...tierForm, reward_type: value, package_id: value === 'discount' ? '' : tierForm.package_id })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="free_package">Free Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tierForm.reward_type === 'discount' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reward_value" className="text-right">Discount %</Label>
                  <Input
                    id="reward_value"
                    type="number"
                    min="1"
                    max="100"
                    value={tierForm.reward_value}
                    onChange={(e) => setTierForm({ ...tierForm, reward_value: parseInt(e.target.value) || 10 })}
                    className="col-span-3"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="package_id" className="text-right">Package</Label>
                  <Select
                    value={tierForm.package_id}
                    onValueChange={(value) => setTierForm({ ...tierForm, package_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - ${pkg.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">Active</Label>
                <Switch
                  id="is_active"
                  checked={tierForm.is_active}
                  onCheckedChange={(checked) => setTierForm({ ...tierForm, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTierDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTier} disabled={loading}>
                {loading ? 'Saving...' : (editingTier ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Required Referrals</TableHead>
                <TableHead>Reward Type</TableHead>
                <TableHead>Reward Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewardTiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.tier_name}</TableCell>
                  <TableCell>{tier.required_referrals}</TableCell>
                  <TableCell>
                    <Badge variant={tier.reward_type === 'discount' ? 'default' : 'secondary'}>
                      {tier.reward_type === 'discount' ? 'Discount' : 'Free Package'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tier.reward_type === 'discount' 
                      ? `${tier.reward_value}%` 
                      : packages.find(p => p.id === tier.package_id)?.name || 'Package'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTier(tier)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTier(tier.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderGiftingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gift Rewards</h3>
          <p className="text-sm text-muted-foreground">Manually distribute rewards to users</p>
        </div>
        <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
          <DialogTrigger asChild>
            <Button>
              <Gift className="h-4 w-4 mr-2" />
              Gift Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Gift Reward to User</DialogTitle>
              <DialogDescription>
                Manually award a reward to a specific user with optional notification.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipient_user_id" className="text-right">User</Label>
                <Select
                  value={giftForm.recipient_user_id}
                  onValueChange={(value) => setGiftForm({ ...giftForm, recipient_user_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} - {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gift_reward_type" className="text-right">Type</Label>
                <Select
                  value={giftForm.reward_type}
                  onValueChange={(value: 'discount' | 'free_package') => 
                    setGiftForm({ ...giftForm, reward_type: value, package_id: value === 'discount' ? '' : giftForm.package_id })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="free_package">Free Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {giftForm.reward_type === 'discount' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gift_reward_value" className="text-right">Discount %</Label>
                  <Input
                    id="gift_reward_value"
                    type="number"
                    min="1"
                    max="100"
                    value={giftForm.reward_value}
                    onChange={(e) => setGiftForm({ ...giftForm, reward_value: parseInt(e.target.value) || 10 })}
                    className="col-span-3"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gift_package_id" className="text-right">Package</Label>
                  <Select
                    value={giftForm.package_id}
                    onValueChange={(value) => setGiftForm({ ...giftForm, package_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - ${pkg.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Reason</Label>
                <Textarea
                  id="reason"
                  value={giftForm.reason}
                  onChange={(e) => setGiftForm({ ...giftForm, reason: e.target.value })}
                  className="col-span-3"
                  placeholder="Optional reason for the gift"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expires_at" className="text-right">Expires</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={giftForm.expires_at}
                  onChange={(e) => setGiftForm({ ...giftForm, expires_at: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notify_user" className="text-right">Notify</Label>
                <Switch
                  id="notify_user"
                  checked={giftForm.notify_user}
                  onCheckedChange={(checked) => setGiftForm({ ...giftForm, notify_user: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGiftDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGiftReward} disabled={loading}>
                {loading ? 'Gifting...' : 'Gift Reward'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All User Rewards</CardTitle>
          <CardDescription>View and manage all distributed rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reward.users.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {reward.users.first_name} {reward.users.last_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {reward.reward_type === 'discount' ? (
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Package className="h-4 w-4 text-green-600" />
                        )}
                        <span>
                          {reward.reward_type === 'discount' 
                            ? `${reward.reward_value}% discount` 
                            : `Free ${reward.packages?.name || 'package'}`
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.source === 'admin_gift' ? 'secondary' : 'default'}>
                        {reward.source === 'admin_gift' ? 'Admin Gift' : 'Referral'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.is_used ? 'secondary' : 'default'}>
                        {reward.is_used ? 'Used' : 'Available'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(reward.earned_at), 'MMM dd, yyyy')}</p>
                        {reward.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {format(new Date(reward.expires_at), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Referral Rewards</h2>
          <p className="text-muted-foreground">
            Manage your referral system, reward tiers, and user incentives
          </p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tiers">Reward Tiers</TabsTrigger>
          <TabsTrigger value="gifting">Gift Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          {renderTiersTab()}
        </TabsContent>

        <TabsContent value="gifting" className="space-y-4">
          {renderGiftingTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}