'use client';

export default function HotelList({ hotels }) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="rounded-xl border border-ink-line bg-ink-raised p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-text-muted mb-4">
        Recommended hotels
      </p>
      <ul className="space-y-3">
        {hotels.map((hotel, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-ink-text">{hotel.name}</p>
              <p className="text-xs text-ink-text-muted">{hotel.tier} · {hotel.rating}</p>
            </div>
            <span className="font-mono-num text-ink-text whitespace-nowrap">
              ${hotel.estimatedCostNightUSD}/night
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
