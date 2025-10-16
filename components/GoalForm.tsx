"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, X } from 'lucide-react';

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
}

interface GoalFormProps {
  goal?: Goal | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GoalForm({ goal, userId, onClose, onSuccess }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setGoalType(goal.goalType);
      setTargetValue(goal.targetValue.toString());
      setCurrentValue(goal.currentValue.toString());
      setUnit(goal.unit);
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : '');
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const target = Number(targetValue);
    if (!Number.isFinite(target) || target <= 0) {
      setError('Target value must be a positive number');
      return;
    }

    if (!unit.trim()) {
      setError('Unit is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        userId,
        title: title.trim(),
        description: description.trim() || null,
        goalType,
        targetValue: target,
        currentValue: Number(currentValue) || 0,
        unit: unit.trim(),
        deadline: deadline || null,
      };

      const url = goal ? `/api/goals/${goal.id}` : '/api/goals';
      const method = goal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${goal ? 'update' : 'create'} goal`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${goal ? 'update' : 'create'} goal`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {goal ? 'Edit Goal' : 'Create New Goal'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Goal Title *
              </label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Lose 15lbs or Bench 250lbs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus={!goal}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={2}
                placeholder="Add any details about this goal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Goal Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGoalType('INCREASE')}
                  className={`px-4 py-3 rounded-md text-sm font-medium transition-colors border ${
                    goalType === 'INCREASE'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent border-input hover:bg-muted/40'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">Increase</div>
                    <div className="text-xs opacity-80 mt-0.5">Gain or reach a number</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType('DECREASE')}
                  className={`px-4 py-3 rounded-md text-sm font-medium transition-colors border ${
                    goalType === 'DECREASE'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent border-input hover:bg-muted/40'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">Decrease</div>
                    <div className="text-xs opacity-80 mt-0.5">Lose or reduce a number</div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {goalType === 'INCREASE'
                  ? 'Example: "Bench 250lbs" - Target: 250, Start: your current bench (e.g., 200)'
                  : 'Example: "Lose 10lbs" - Target: 10 (amount to lose), Start: 0 (haven\'t lost any yet)'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetValue" className="block text-sm font-medium mb-2">
                  Target Value *
                </label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="250"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium mb-2">
                  Unit *
                </label>
                <Input
                  id="unit"
                  type="text"
                  placeholder="lbs, kg, miles"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>
            </div>

            {!goal && (
              <div>
                <label htmlFor="currentValue" className="block text-sm font-medium mb-2">
                  Starting Value
                </label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Your current progress (defaults to 0)
                </p>
              </div>
            )}

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-2">
                Deadline (optional)
              </label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md text-sm bg-red-500/10 text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (goal ? 'Updating...' : 'Creating...') : (goal ? 'Update Goal' : 'Create Goal')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
