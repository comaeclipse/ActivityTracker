"use client";

import { useState } from 'react';
import { Plus, X, ChevronLeft, Dumbbell, Activity, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Level = 'collapsed' | 'category' | 'strength' | 'cardio' | 'calisthenics';
type CardioType = 'RUN' | 'WALK' | 'BIKE' | 'SWIM';

const cardioOptions: { value: CardioType; label: string }[] = [
  { value: 'RUN',  label: 'Run'  },
  { value: 'WALK', label: 'Walk' },
  { value: 'BIKE', label: 'Bike' },
  { value: 'SWIM', label: 'Swim' },
];

export default function ActivityLogger() {
  const { user } = useAuth();

  const [level, setLevel]           = useState<Level>('collapsed');
  const [cardioType, setCardioType] = useState<CardioType>('RUN');
  const [duration, setDuration]     = useState('');
  const [distance, setDistance]     = useState('');
  const [notes, setNotes]           = useState('');
  const [activityDate, setActivityDate] = useState(nowLocal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function nowLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  const reset = () => {
    setLevel('collapsed');
    setCardioType('RUN');
    setDuration('');
    setDistance('');
    setNotes('');
    setMessage(null);
    setActivityDate(nowLocal());
  };

  const submit = async (type: string) => {
    if (!user) return;
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid duration' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        userId: user.id,
        type,
        durationMinutes: Number(duration),
        activityDate: new Date(activityDate).toISOString(),
        notes: notes || undefined,
      };
      if (distance && !isNaN(Number(distance)) && Number(distance) > 0) {
        payload.value = Number(distance);
        payload.unit  = 'miles';
      }
      const res  = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log activity');
      setMessage({ type: 'success', text: 'Logged!' });
      setTimeout(() => { reset(); window.location.reload(); }, 800);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to log activity' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const expanded = level !== 'collapsed';

  return (
    <div
      className={`bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg transition-all duration-500 ease-in-out overflow-hidden ${expanded ? 'p-5' : 'p-3'}`}
      style={{ maxHeight: expanded ? '900px' : '68px' }}
    >

      {/* ── Collapsed ── */}
      {level === 'collapsed' && (
        <button
          onClick={() => setLevel('category')}
          className="w-full bg-white text-blue-700 rounded-lg py-2 px-4 font-semibold flex items-center justify-center gap-2 active:bg-blue-50 transition"
        >
          <Plus className="w-5 h-5" />
          Log workout
        </button>
      )}

      {/* ── Category ── */}
      {level === 'category' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">What would you like to log?</h3>
            <button onClick={reset} className="text-white/70 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setLevel('strength')}
              className="py-7 rounded-xl border-2 border-blue-400/50 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold text-sm transition flex flex-col items-center gap-2"
            >
              <Dumbbell className="w-6 h-6" />
              Strength
            </button>
            <button
              onClick={() => setLevel('cardio')}
              className="py-7 rounded-xl border-2 border-blue-400/50 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold text-sm transition flex flex-col items-center gap-2"
            >
              <Activity className="w-6 h-6" />
              Cardio
            </button>
            <button
              onClick={() => setLevel('calisthenics')}
              className="py-7 rounded-xl border-2 border-blue-400/50 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold text-sm transition flex flex-col items-center gap-2"
            >
              <Zap className="w-6 h-6" />
              Calisthenics
            </button>
          </div>
        </div>
      )}

      {/* ── Strength ── */}
      {level === 'strength' && (
        <div className="space-y-4 animate-fadeIn">
          <FormHeader title="Strength Training" onBack={() => setLevel('category')} onClose={reset} />
          <DurationField value={duration} onChange={setDuration} />
          <DateField value={activityDate} onChange={setActivityDate} />
          <NotesField value={notes} onChange={setNotes} />
          {message && <StatusMessage {...message} />}
          <SubmitBtn label={isSubmitting ? 'Logging…' : 'Log Strength'} disabled={isSubmitting || !duration} onClick={() => submit('WEIGHTS')} />
        </div>
      )}

      {/* ── Cardio ── */}
      {level === 'cardio' && (
        <div className="space-y-4 animate-fadeIn">
          <FormHeader title="Cardio" onBack={() => setLevel('category')} onClose={reset} />
          <div className="grid grid-cols-4 gap-2">
            {cardioOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setCardioType(opt.value)}
                className={`py-2 rounded-lg border-2 text-sm font-semibold transition ${
                  cardioType === opt.value
                    ? 'border-white bg-white text-blue-700'
                    : 'border-blue-400/50 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {(cardioType === 'RUN' || cardioType === 'WALK') && (
            <DistanceField value={distance} onChange={setDistance} />
          )}
          <DurationField value={duration} onChange={setDuration} />
          <DateField value={activityDate} onChange={setActivityDate} />
          <NotesField value={notes} onChange={setNotes} />
          {message && <StatusMessage {...message} />}
          <SubmitBtn label={isSubmitting ? 'Logging…' : 'Log Cardio'} disabled={isSubmitting || !duration} onClick={() => submit(cardioType)} />
        </div>
      )}

      {/* ── Calisthenics ── */}
      {level === 'calisthenics' && (
        <div className="space-y-4 animate-fadeIn">
          <FormHeader title="Calisthenics" onBack={() => setLevel('category')} onClose={reset} />
          <DurationField value={duration} onChange={setDuration} />
          <DateField value={activityDate} onChange={setActivityDate} />
          <NotesField value={notes} onChange={setNotes} />
          {message && <StatusMessage {...message} />}
          <SubmitBtn label={isSubmitting ? 'Logging…' : 'Log Calisthenics'} disabled={isSubmitting || !duration} onClick={() => submit('WEIGHTS')} />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FormHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium transition">
        <ChevronLeft className="w-4 h-4" />
        {title}
      </button>
      <button onClick={onClose} className="text-white/70 hover:text-white transition">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function DurationField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/80 mb-1.5 block">Duration (minutes) *</label>
      <input
        type="number" min="1" placeholder="45"
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-white text-blue-900 placeholder-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  );
}

function DistanceField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/80 mb-1.5 block">Distance (miles, optional)</label>
      <input
        type="number" min="0" step="0.01" placeholder="3.1"
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-white text-blue-900 placeholder-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/80 mb-1.5 block">Date & time</label>
      <input
        type="datetime-local" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-white text-blue-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/80 mb-1.5 block">Notes (optional)</label>
      <textarea
        rows={2} placeholder="How did it feel?"
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-white text-blue-900 placeholder-blue-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  );
}

function SubmitBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition ${
        disabled
          ? 'bg-white/30 text-white/50 cursor-not-allowed'
          : 'bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100'
      }`}
    >
      {label}
    </button>
  );
}

function StatusMessage({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <p className={`text-sm font-medium ${type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
      {text}
    </p>
  );
}
