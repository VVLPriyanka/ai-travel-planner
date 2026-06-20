'use client';

import { useState } from 'react';

const INTEREST_OPTIONS = ['Food', 'Culture', 'Adventure', 'Shopping', 'Nature', 'Relaxation'];

export default function TripForm({ onSubmit, onCancel, submitting }) {
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(4);
  const [budgetTier, setBudgetTier] = useState('Medium');
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState('');

  function toggleInterest(interest) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!destination.trim()) {
      setError('Tell us where you\u2019re headed.');
      return;
    }
    try {
      await onSubmit({ destination: destination.trim(), durationDays: Number(durationDays), budgetTier, interests });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ticket overflow-hidden">
      <div className="ticket-stripe" />
      <form onSubmit={handleSubmit} className="p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-paper-text-muted mb-1">
          New itinerary request
        </p>
        <h2 className="font-display text-xl mb-5">Where to?</h2>

        {error && (
          <p className="mb-4 text-sm text-airmail-red bg-airmail-red/10 border border-airmail-red/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <label className="block text-xs uppercase tracking-wide text-paper-text-muted mb-1" htmlFor="destination">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          required
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Kyoto, Japan"
          className="w-full mb-4 px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text focus:outline-none focus:border-airmail-blue"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-paper-text-muted mb-1" htmlFor="days">
              Days
            </label>
            <input
              id="days"
              type="number"
              min={1}
              max={30}
              required
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text font-mono-num focus:outline-none focus:border-airmail-blue"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-paper-text-muted mb-1" htmlFor="budget">
              Budget
            </label>
            <select
              id="budget"
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text focus:outline-none focus:border-airmail-blue"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <p className="block text-xs uppercase tracking-wide text-paper-text-muted mb-2">Interests</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {INTEREST_OPTIONS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() => toggleInterest(interest)}
                aria-pressed={active}
                className={`text-sm px-3 py-1.5 rounded-full border transition ${
                  active
                    ? 'bg-ink text-paper border-ink'
                    : 'border-paper-line text-paper-text-muted hover:border-airmail-blue'
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-md bg-ink text-paper font-medium hover:bg-ink-raised transition disabled:opacity-60"
          >
            {submitting ? 'Drafting itinerary…' : 'Generate itinerary'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-md border border-paper-line text-paper-text-muted hover:border-airmail-red transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
