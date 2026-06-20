'use client';

import { useState } from 'react';
import { togglePackingItem, regeneratePackingList } from '@/lib/api';

const CATEGORY_ORDER = ['Documents', 'Clothing', 'Gear', 'Other'];

export default function PackingList({ trip, token, onTripUpdate }) {
  const [busyId, setBusyId] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: (trip.packingList || []).filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  const packedCount = (trip.packingList || []).filter((i) => i.isPacked).length;
  const total = (trip.packingList || []).length;

  async function handleToggle(item) {
    setError('');
    setBusyId(item._id);
    try {
      const updated = await togglePackingItem(token, trip._id, item._id, !item.isPacked);
      onTripUpdate(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRegenerate() {
    setError('');
    setRegenerating(true);
    try {
      const updated = await regeneratePackingList(token, trip._id);
      onTripUpdate(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-line bg-ink-raised p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-text-muted">
          Weather-aware packing list
        </p>
        <span className="font-mono-num text-xs text-ink-text-muted whitespace-nowrap">
          {packedCount}/{total} packed
        </span>
      </div>

      {trip.climateSummary && (
        <p className="text-sm text-ink-text mt-2 mb-4 bg-ink/40 border border-ink-line rounded-md px-3 py-2">
          {trip.climateSummary}
        </p>
      )}

      {error && (
        <p className="mb-3 text-sm text-bad bg-bad/10 border border-bad/30 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="text-xs uppercase tracking-wide text-brass-strong mb-2">{group.category}</p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item._id} className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id={`pack-${item._id}`}
                    checked={item.isPacked}
                    disabled={busyId === item._id}
                    onChange={() => handleToggle(item)}
                    className="mt-1 accent-[var(--brass)]"
                  />
                  <label htmlFor={`pack-${item._id}`} className="text-sm cursor-pointer">
                    <span className={item.isPacked ? 'line-through text-ink-text-muted' : 'text-ink-text'}>
                      {item.item}
                    </span>
                    {item.reason && (
                      <span className="block text-xs text-ink-text-muted">{item.reason}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="mt-5 text-xs text-ink-text-muted hover:text-brass-strong transition disabled:opacity-60"
      >
        {regenerating ? 'Re-checking the forecast…' : '↻ Regenerate packing list'}
      </button>
    </div>
  );
}
