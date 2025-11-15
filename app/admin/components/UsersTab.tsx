'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { MergedUser } from '../page'; // Import the new user type
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatForDisplay } from '@/lib/phone';

interface UsersTabProps {
  users: MergedUser[];
  loading: boolean;
}

export const UsersTab = ({ users, loading }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<MergedUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const fullName = user.fullName || '';
    const email = user.email || '';
    const safeSearchTerm = searchTerm || '';

    return (
      fullName.toLowerCase().includes(safeSearchTerm.toLowerCase()) ||
      email.toLowerCase().includes(safeSearchTerm.toLowerCase())
    );
  });

  const handleViewUser = (user: MergedUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Displaying a combined list of users from Clerk and Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/3 pl-8"
              />
            </div>
          </div>
          <div className="space-y-4">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div key={user.clerkId || user.supabaseUserId || `user-${index}`} className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{user.fullName || 'No Name in DB'}</span>
                      <span className="text-sm text-gray-500 ml-2">{user.email}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleViewUser(user)}>
                      View
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>
                      Joined on {user.clerkCreatedAt ? new Date(user.clerkCreatedAt).toLocaleDateString() : 'Unknown'}
                    </span>
                    <span className="mx-2">|</span>
                    <span>
                      Last sign-in: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-fit bg-white p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">User Details</DialogTitle>
            <DialogDescription className="text-gray-500">
              Detailed information about the user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Full Name:</div>
                <div>{selectedUser.fullName || 'No Name in DB'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Email:</div>
                <div>{selectedUser.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Phone:</div>
                <div>{selectedUser.phone ? formatForDisplay(selectedUser.phone) : 'Not provided'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Clerk ID:</div>
                <div className="text-sm">{selectedUser.clerkId}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Joined On:</div>
                <div>{selectedUser.clerkCreatedAt ? new Date(selectedUser.clerkCreatedAt).toLocaleString() : 'Unknown'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Last Sign-in:</div>
                <div>{selectedUser.lastSignInAt ? new Date(selectedUser.lastSignInAt).toLocaleString() : 'Never'}</div>
              </div>
              {selectedUser.supabaseUserId && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Supabase User ID:</div>
                  <div className="text-sm">{selectedUser.supabaseUserId}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Status:</div>
                <div>
                  <span className={selectedUser.isSynced ? 'text-green-600' : 'text-red-600'}>
                    {selectedUser.isSynced ? 'Synced' : 'Not Synced'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <DialogDescription>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};