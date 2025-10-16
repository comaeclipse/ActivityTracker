"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, X } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface GoalUpdateFormProps {
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GoalUpdateForm({ goal, onClose, onSuccess }: GoalUpdateFormProps) {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue === 0) {
      setError('Please enter a valid progress value');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/goals/${goal.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: numValue, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add update');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Add Progress Update
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
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{goal.title}</span>
                <br />
                Current: {goal.currentValue} / {goal.targetValue} {goal.unit}
              </p>
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium mb-2">
                Progress Value {goal.unit && `(${goal.unit})`}
              </label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="e.g., 5"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the amount of progress (can be positive or negative)
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Any notes about this progress?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
                {isSubmitting ? 'Adding...' : 'Add Update'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
