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
    <div className="glass p-6">
      <form onSubmit={handleSubmit}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint mb-1">
          New itinerary request
        </p>
        <h2 className="font-display text-xl font-semibold text-text mb-5">Where to?</h2>

        {error && (
          <p className="mb-4 text-sm text-bad bg-bad/10 border border-bad/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <label className="block text-xs uppercase tracking-wide text-text-faint mb-1.5" htmlFor="destination">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          required
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Goa, India"
          className="glass-input w-full mb-4 px-4 py-2.5 outline-none"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-text-faint mb-1.5" htmlFor="days">
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
              className="glass-input w-full px-4 py-2.5 outline-none font-mono-num"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-text-faint mb-1.5" htmlFor="budget">
              Budget
            </label>
            <select
              id="budget"
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="glass-input w-full px-4 py-2.5 outline-none"
            >
              <option className="bg-[#2a1530]" value="Low">Low</option>
              <option className="bg-[#2a1530]" value="Medium">Medium</option>
              <option className="bg-[#2a1530]" value="High">High</option>
            </select>
          </div>
        </div>

        <p className="block text-xs uppercase tracking-wide text-text-faint mb-2">Interests</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {INTEREST_OPTIONS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() => toggleInterest(interest)}
                aria-pressed={active}
                className={
                  active
                    ? 'chip !bg-white/20 !border-accent-strong !text-text'
                    : 'chip hover:border-glass-border-strong'
                }
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
            className="btn-pill btn-pill-primary flex-1 disabled:opacity-60"
          >
            {submitting ? 'Drafting itinerary…' : 'Generate itinerary'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-pill btn-pill-glass"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
