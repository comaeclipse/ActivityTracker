"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Edit, Trash2, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

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

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onAddUpdate: (goal: Goal) => void;
}

export default function GoalCard({ goal, onEdit, onDelete, onAddUpdate }: GoalCardProps) {
  // For both INCREASE and DECREASE, currentValue tracks progress toward target
  // For DECREASE goals: currentValue = amount decreased (e.g., 5lbs lost)
  // For INCREASE goals: currentValue = current amount (e.g., current bench 200lbs)
  const progress = (goal.currentValue / goal.targetValue) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const remaining = goal.targetValue - goal.currentValue;

  const getStatusColor = () => {
    if (goal.status === 'COMPLETED') return 'text-green-500 bg-green-500/10';
    if (goal.status === 'ARCHIVED') return 'text-gray-500 bg-gray-500/10';
    return 'text-blue-500 bg-blue-500/10';
  };

  const getMotivationalMessage = () => {
    if (clampedProgress >= 100) {
      return "Goal achieved! Outstanding work!";
    } else if (clampedProgress >= 75) {
      return "Almost there! Keep pushing!";
    } else if (clampedProgress >= 50) {
      return `You're halfway there! ${Math.round(clampedProgress)}% complete!`;
    } else if (clampedProgress >= 25) {
      return `Good progress! You're ${Math.round(clampedProgress)}% of the way there!`;
    } else if (clampedProgress > 0) {
      return `Great start! Keep it up!`;
    } else {
      return "Let's get started on this goal!";
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, overdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today!', overdue: false };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, overdue: false };
    } else {
      return {
        text: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        overdue: false,
      };
    }
  };

  const deadlineInfo = formatDeadline(goal.deadline);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{goal.title}</CardTitle>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              className="h-8 w-8 p-0"
              title="Edit goal"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              title="Delete goal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
            <span className="font-semibold text-primary">
              {Math.round(clampedProgress)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          <p className="text-sm font-medium text-primary">
            {getMotivationalMessage()}
          </p>
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground">
              {remaining.toFixed(1)} {goal.unit} remaining
            </p>
          )}
        </div>

        {/* Status and Deadline */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${getStatusColor()}`}>
            {goal.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
            <span className="font-medium">{goal.status}</span>
          </div>

          {deadlineInfo && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
              deadlineInfo.overdue ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground bg-muted'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>{deadlineInfo.text}</span>
            </div>
          )}

          {goal._count && goal._count.updates > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{goal._count.updates} updates</span>
            </div>
          )}
        </div>

        {/* Add Update Button */}
        {goal.status === 'ACTIVE' && (
          <Button
            onClick={() => onAddUpdate(goal)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Add Progress Update
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
