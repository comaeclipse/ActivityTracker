"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SpeedInsights } from "@vercel/speed-insights/next";

interface UserData {
  id: string;
  username: string;
  createdAt: string;
  showWeightPublicly: boolean;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${encodeURIComponent(username)}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
          } else {
            setError(data.error || 'Failed to load user profile');
          }
          return;
        }

        setUser(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    }

    if (username) {
      fetchUser();
    }
  }, [username]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
        <SpeedInsights />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {error === 'User not found' ? 'User Not Found' : 'Error'}
              </h2>
              <p className="text-muted-foreground">
                {error === 'User not found'
                  ? `We couldn't find a user with the username "${username}"`
                  : error || 'Something went wrong'}
              </p>
            </div>
          </CardContent>
        </Card>
        <SpeedInsights />
      </div>
    );
  }

  return (
    <>
      <ProfileView
        userId={user.id}
        username={user.username}
        createdAt={user.createdAt}
        isOwnProfile={false}
      />
      <SpeedInsights />
    </>
  );
}
