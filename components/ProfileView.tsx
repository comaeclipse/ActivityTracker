"use client";

import { useState } from 'react';
import UserActivityList from '@/components/UserActivityList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Calendar, Link, Check } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const memberSince = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleCopyUrl = async () => {
    const profileUrl = `${window.location.origin}/user/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isOwnProfile ? 'Your Profile' : `${username}'s Profile`}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
                  Copy URL
                </>
              )}
            </Button>
          </div>
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
