"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GoalCard from '@/components/GoalCard';
import GoalForm from '@/components/GoalForm';
import GoalUpdateForm from '@/components/GoalUpdateForm';
import { Target, Plus, Activity, Filter } from 'lucide-react';
import { SpeedInsights } from "@vercel/speed-insights/next";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  goalType: 'INCREASE' | 'DECREASE';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    updates: number;
  };
}

export default function GoalsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user, statusFilter]);

  const fetchGoals = async () => {
    try {
      setIsLoadingGoals(true);
      setError(null);

      const url = new URL('/api/goals', window.location.origin);
      url.searchParams.set('userId', user!.id);
      if (statusFilter !== 'ALL') {
        url.searchParams.set('status', statusFilter);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch goals');
      }

      setGoals(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete goal');
      }

      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  const handleAddUpdate = (goal: Goal) => {
    setUpdatingGoal(goal);
    setShowUpdateForm(true);
  };

  const handleFormSuccess = () => {
    fetchGoals();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <SpeedInsights />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredGoals = statusFilter === 'ALL'
    ? goals
    : goals.filter(goal => goal.status === statusFilter);

  const activeGoalsCount = goals.filter(g => g.status === 'ACTIVE').length;
  const completedGoalsCount = goals.filter(g => g.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-8 w-8" />
            Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your fitness goals and celebrate progress
          </p>
        </div>
        <Button onClick={handleCreateGoal} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{activeGoalsCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Active Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{completedGoalsCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{goals.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Goals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Show:</span>
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Goals List */}
      {isLoadingGoals ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {statusFilter === 'ALL' ? 'No goals yet' : `No ${statusFilter.toLowerCase()} goals`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'ALL'
                  ? 'Create your first goal to start tracking your progress!'
                  : `You don't have any ${statusFilter.toLowerCase()} goals.`}
              </p>
              {statusFilter === 'ALL' && (
                <Button onClick={handleCreateGoal} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Goal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onAddUpdate={handleAddUpdate}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showGoalForm && (
        <GoalForm
          goal={editingGoal}
          userId={user.id}
          onClose={() => setShowGoalForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {showUpdateForm && updatingGoal && (
        <GoalUpdateForm
          goal={updatingGoal}
          onClose={() => setShowUpdateForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <SpeedInsights />
    </div>
  );
}
