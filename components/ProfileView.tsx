"use client";

import UserActivityList from '@/components/UserActivityList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Calendar } from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  username: string;
  createdAt: string;
  isOwnProfile?: boolean;
}

export default function ProfileView({
  userId,
  username,
  createdAt,
  isOwnProfile = false,
}: ProfileViewProps) {
  const memberSince = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isOwnProfile ? 'Your Profile' : `${username}'s Profile`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="text-lg font-semibold text-foreground">{username}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member since {memberSince}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <UserActivityList userId={userId} />
    </div>
  );
}
