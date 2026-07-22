"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Calendar,
  Droplet,
  Bike,
  Dumbbell,
  PersonStanding,
  Heart,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ActivityMap from "@/components/ActivityMap";

interface ActivityData {
  id: string;
  user: {
    id: string;
    username: string;
  };
  type: "RUN" | "WALK" | "SWIM" | "WEIGHTS" | "BIKE" | "HYDRATION";
  value: number | null;
  unit: string | null;
  durationMinutes: number | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  activityDate: string;
  createdAt: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
}

interface UserActivityListProps {
  userId: string;
}

const activityIcons = {
  RUN: PersonStanding,
  WALK: PersonStanding,
  SWIM: Droplet,
  WEIGHTS: Dumbbell,
  BIKE: Bike,
  HYDRATION: Droplet,
};

const activityColors = {
  RUN: "text-blue-500 bg-blue-500/10",
  WALK: "text-green-500 bg-green-500/10",
  SWIM: "text-cyan-500 bg-cyan-500/10",
  WEIGHTS: "text-orange-500 bg-orange-500/10",
  BIKE: "text-purple-500 bg-purple-500/10",
  HYDRATION: "text-indigo-500 bg-indigo-500/10",
};

const activityLabels = {
  RUN: "Run",
  WALK: "Walk",
  SWIM: "Swim",
  WEIGHTS: "Weights",
  BIKE: "Bike",
  HYDRATION: "Hydration",
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatActivityDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function UserActivityList({ userId }: UserActivityListProps) {
  const { user: currentUser } = useAuth();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Only the owner viewing their own list can delete.
  const canDelete = currentUser?.id === userId;
  const activityGroups = activities.reduce<ActivityData[][]>(
    (groups, activity) => {
      const previousGroup = groups.at(-1);

      if (previousGroup?.[0].activityDate === activity.activityDate) {
        previousGroup.push(activity);
      } else {
        groups.push([activity]);
      }

      return groups;
    },
    [],
  );

  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true);
        const url = new URL("/api/feed", window.location.origin);
        url.searchParams.set("userId", userId);
        url.searchParams.set("take", "100");
        if (currentUser) {
          url.searchParams.set("currentUserId", currentUser.id);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch activities");
        }

        setActivities(data.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load activities");
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [userId, currentUser]);

  const handleLike = async (activityId: string) => {
    if (!currentUser) {
      return; // Can't like without being logged in
    }

    try {
      // Optimistically update the UI
      setActivities((prev) =>
        prev.map((activity) => {
          if (activity.id === activityId) {
            const isLiked = activity.isLikedByCurrentUser;
            return {
              ...activity,
              isLikedByCurrentUser: !isLiked,
              likeCount: isLiked
                ? activity.likeCount - 1
                : activity.likeCount + 1,
            };
          }
          return activity;
        }),
      );

      // Send request to server
      const response = await fetch(`/api/activities/${activityId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (!response.ok) {
        // Revert on error
        setActivities((prev) =>
          prev.map((activity) => {
            if (activity.id === activityId) {
              const isLiked = activity.isLikedByCurrentUser;
              return {
                ...activity,
                isLikedByCurrentUser: !isLiked,
                likeCount: isLiked
                  ? activity.likeCount - 1
                  : activity.likeCount + 1,
              };
            }
            return activity;
          }),
        );
        throw new Error("Failed to update like");
      }
    } catch (err: any) {
      console.error("Error toggling like:", err);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Delete this activity? This cannot be undone.")) return;

    setDeletingId(activityId);
    try {
      const response = await fetch(
        `/api/activities/${activityId}?userId=${currentUser.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete activity");
      }

      // Remove from the list once the server confirms it's gone.
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (err: any) {
      console.error("Error deleting activity:", err);
      alert(err.message || "Failed to delete activity. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Your Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Your Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Your Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No activities yet. Start logging your activities to see them here!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Your Activities ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activityGroups.map((group) => {
            const isLinkedGroup = group.length > 1;

            return (
              <div
                key={group[0].id}
                className={
                  isLinkedGroup
                    ? "m-3 overflow-hidden rounded-lg border border-border bg-muted/20 shadow-sm"
                    : ""
                }
              >
                {isLinkedGroup && (
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Activity className="h-4 w-4 text-primary" />
                      <span>Linked workouts</span>
                      <Badge variant="secondary">
                        {group.length} activities
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatActivityDate(group[0].activityDate)}</span>
                    </div>
                  </div>
                )}
                <div className={isLinkedGroup ? "divide-y divide-border" : ""}>
                  {group.map((activity) => {
                    const Icon = activityIcons[activity.type];
                    const colorClass = activityColors[activity.type];
                    const label = activityLabels[activity.type];

                    return (
                      <div
                        key={activity.id}
                        className="px-4 py-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  {label}:{" "}
                                  {activity.value !== null &&
                                    activity.unit !== null &&
                                    `${activity.value} ${activity.unit}`}
                                  {activity.value !== null &&
                                    activity.unit !== null &&
                                    activity.durationMinutes !== null &&
                                    " • "}
                                  {activity.durationMinutes !== null &&
                                    `${activity.durationMinutes} min`}
                                </p>
                                {!isLinkedGroup && (
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                      {formatActivityDate(
                                        activity.activityDate,
                                      )}
                                    </span>
                                  </div>
                                )}
                                {activity.notes && (
                                  <p className="text-sm text-muted-foreground mt-2 italic">
                                    "{activity.notes}"
                                  </p>
                                )}
                                {/* Like button and count */}
                                <div className="flex items-center gap-3 mt-3">
                                  <button
                                    onClick={() => handleLike(activity.id)}
                                    disabled={!currentUser}
                                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                                      activity.isLikedByCurrentUser
                                        ? "text-red-500 hover:text-red-600"
                                        : "text-muted-foreground hover:text-red-500"
                                    } ${!currentUser ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                  >
                                    <Heart
                                      className={`h-4 w-4 ${
                                        activity.isLikedByCurrentUser
                                          ? "fill-current"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                  {activity.likeCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {activity.likeCount}{" "}
                                      {activity.likeCount === 1
                                        ? "person"
                                        : "people"}{" "}
                                      liked this
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground block mt-2">
                                  {formatDate(activity.createdAt)}
                                </span>
                              </div>
                              {/* Activity Map */}
                              {activity.latitude !== null &&
                                activity.longitude !== null && (
                                  <ActivityMap
                                    latitude={activity.latitude}
                                    longitude={activity.longitude}
                                  />
                                )}
                            </div>
                          </div>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(activity.id)}
                              disabled={deletingId === activity.id}
                              title="Delete activity"
                              aria-label="Delete activity"
                              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                              {deletingId === activity.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
