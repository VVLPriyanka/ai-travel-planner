'use client';

export default function TripList({ trips, selectedId, onSelect, onNew }) {
  return (
    <div className="space-y-3">
      <button
        onClick={onNew}
        className="w-full rounded-2xl border border-dashed border-glass-border-strong text-text-muted hover:border-accent-strong hover:text-accent-strong transition py-3 text-sm font-semibold"
      >
        + New trip
      </button>

      {trips.length === 0 && (
        <p className="text-sm text-text-muted px-1 py-4">
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
                className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                  active
                    ? 'bg-white/12 border-accent-strong'
                    : 'border-glass-border hover:border-glass-border-strong bg-white/[0.03]'
                }`}
              >
                <p className="font-display text-base font-semibold text-text truncate">{trip.destination}</p>
                <p className="text-xs text-text-muted mt-0.5">
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
