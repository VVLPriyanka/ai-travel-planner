'use client';

import { useState } from 'react';
import { addActivity, removeActivity, regenerateDay } from '@/lib/api';
import { formatUSD } from '@/lib/format';

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
    <div className="glass p-6">
      <div className="flex items-baseline justify-between mb-1 gap-3">
        <h3 className="font-display text-xl font-semibold text-text">
          Day {day.dayNumber}
          {day.theme && <span className="text-text-muted text-base font-normal"> — {day.theme}</span>}
        </h3>
        <button
          onClick={() => setShowRegenForm((s) => !s)}
          className="text-xs text-text-muted hover:text-accent-strong transition whitespace-nowrap shrink-0"
        >
          ↻ Regenerate day
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-bad bg-bad/10 border border-bad/30 rounded-xl px-3 py-2">{error}</p>
      )}

      {showRegenForm && (
        <form onSubmit={handleRegenerate} className="mb-4 glass-soft p-3">
          <label className="block text-xs text-text-faint mb-1.5" htmlFor={`feedback-${day.dayNumber}`}>
            What should change about Day {day.dayNumber}?
          </label>
          <div className="flex gap-2">
            <input
              id={`feedback-${day.dayNumber}`}
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. more outdoor activities, less walking"
              className="glass-input flex-1 px-3 py-1.5 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={regenerating}
              className="btn-pill btn-pill-primary !px-4 !py-1.5 text-sm disabled:opacity-60"
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
            className="glass-soft px-4 py-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="badge-pill !py-1 !px-2.5 !text-[10px]">{act.timeOfDay}</span>
                <span className="font-medium text-text truncate">{act.title}</span>
              </div>
              {act.description && (
                <p className="text-xs text-text-muted">{act.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono-num text-sm text-text-muted">
                {formatUSD(act.estimatedCostUSD)}
              </span>
              <button
                onClick={() => handleRemove(act._id)}
                disabled={removingId === act._id}
                aria-label={`Remove ${act.title}`}
                className="text-text-muted hover:text-bad transition disabled:opacity-50"
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
          className="glass-input flex-1 min-w-[160px] px-3 py-1.5 text-sm outline-none"
        />
        <select
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="glass-input px-2 py-1.5 text-sm outline-none"
        >
          {TIME_OPTIONS.map((t) => (
            <option className="bg-[#2a1530]" key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={newCost}
          onChange={(e) => setNewCost(e.target.value)}
          placeholder="$"
          className="glass-input w-20 px-2 py-1.5 text-sm font-mono-num outline-none"
        />
        <button
          type="submit"
          disabled={adding}
          className="btn-pill btn-pill-glass !px-3 !py-1.5 text-sm disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
    </div>
  );
}
