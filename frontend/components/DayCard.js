'use client';

import { useState } from 'react';
import { addActivity, removeActivity, regenerateDay } from '@/lib/api';

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

export default function DayCard({ day, trip, token, onTripUpdate }) {
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('Afternoon');
  const [newCost, setNewCost] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [showRegenForm, setShowRegenForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const [error, setError] = useState('');

  async function handleAddActivity(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError('');
    setAdding(true);
    try {
      const updated = await addActivity(token, trip._id, {
        dayNumber: day.dayNumber,
        title: newTitle.trim(),
        timeOfDay: newTime,
        estimatedCostUSD: Number(newCost) || 0,
      });
      onTripUpdate(updated);
      setNewTitle('');
      setNewCost('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(activityId) {
    setError('');
    setRemovingId(activityId);
    try {
      const updated = await removeActivity(token, trip._id, activityId);
      onTripUpdate(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleRegenerate(e) {
    e.preventDefault();
    setError('');
    setRegenerating(true);
    try {
      const updated = await regenerateDay(token, trip._id, { dayNumber: day.dayNumber, feedback });
      onTripUpdate(updated);
      setShowRegenForm(false);
      setFeedback('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="border-l-2 border-brass/60 pl-6 relative">
      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brass border-4 border-ink" />

      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-display text-xl text-ink-text">
          Day {day.dayNumber}
          {day.theme && <span className="text-ink-text-muted text-base font-body"> — {day.theme}</span>}
        </h3>
        <button
          onClick={() => setShowRegenForm((s) => !s)}
          className="text-xs text-ink-text-muted hover:text-brass-strong transition whitespace-nowrap"
        >
          ↻ Regenerate day
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-bad bg-bad/10 border border-bad/30 rounded-md px-3 py-2">{error}</p>
      )}

      {showRegenForm && (
        <form onSubmit={handleRegenerate} className="mb-4 bg-ink-raised border border-ink-line rounded-lg p-3">
          <label className="block text-xs text-ink-text-muted mb-1" htmlFor={`feedback-${day.dayNumber}`}>
            What should change about Day {day.dayNumber}?
          </label>
          <div className="flex gap-2">
            <input
              id={`feedback-${day.dayNumber}`}
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. more outdoor activities, less walking"
              className="flex-1 px-3 py-1.5 rounded-md border border-ink-line bg-ink text-ink-text text-sm focus:outline-none focus:border-brass"
            />
            <button
              type="submit"
              disabled={regenerating}
              className="px-3 py-1.5 rounded-md bg-brass text-ink text-sm font-medium hover:bg-brass-strong transition disabled:opacity-60"
            >
              {regenerating ? 'Working…' : 'Regenerate'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2.5 mb-4">
        {day.activities.map((act) => (
          <div
            key={act._id}
            className="bg-ink-raised border border-ink-line rounded-lg px-4 py-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-ink text-ink-text-muted border border-ink-line">
                  {act.timeOfDay}
                </span>
                <span className="font-medium text-ink-text truncate">{act.title}</span>
              </div>
              {act.description && (
                <p className="text-xs text-ink-text-muted">{act.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono-num text-sm text-ink-text-muted">
                ${act.estimatedCostUSD}
              </span>
              <button
                onClick={() => handleRemove(act._id)}
                disabled={removingId === act._id}
                aria-label={`Remove ${act.title}`}
                className="text-ink-text-muted hover:text-bad transition disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddActivity} className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add an activity…"
          className="flex-1 min-w-[160px] px-3 py-1.5 rounded-md border border-ink-line bg-ink text-ink-text text-sm focus:outline-none focus:border-brass"
        />
        <select
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="px-2 py-1.5 rounded-md border border-ink-line bg-ink text-ink-text text-sm focus:outline-none focus:border-brass"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={newCost}
          onChange={(e) => setNewCost(e.target.value)}
          placeholder="$"
          className="w-20 px-2 py-1.5 rounded-md border border-ink-line bg-ink text-ink-text text-sm font-mono-num focus:outline-none focus:border-brass"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-3 py-1.5 rounded-md border border-brass text-brass-strong text-sm hover:bg-brass hover:text-ink transition disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
    </div>
  );
}
