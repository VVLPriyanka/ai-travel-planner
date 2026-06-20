'use client';

export default function TripList({ trips, selectedId, onSelect, onNew }) {
  return (
    <div className="space-y-3">
      <button
        onClick={onNew}
        className="w-full rounded-xl border border-dashed border-ink-line text-ink-text-muted hover:border-brass hover:text-brass-strong transition py-3 text-sm font-medium"
      >
        + New trip
      </button>

      {trips.length === 0 && (
        <p className="text-sm text-ink-text-muted px-1 py-4">
          No trips yet. Create your first itinerary to begin.
        </p>
      )}

      <ul className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
        {trips.map((trip) => {
          const active = trip._id === selectedId;
          return (
            <li key={trip._id}>
              <button
                onClick={() => onSelect(trip)}
                className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                  active
                    ? 'bg-ink-raised border-brass'
                    : 'border-ink-line hover:border-ink-text-muted'
                }`}
              >
                <p className="font-display text-base truncate">{trip.destination}</p>
                <p className="text-xs text-ink-text-muted font-mono-num mt-0.5">
                  {trip.durationDays}d · {trip.budgetTier} budget
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
