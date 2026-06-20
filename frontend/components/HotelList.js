'use client';

import { formatINR } from '@/lib/format';

export default function HotelList({ hotels }) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="glass-soft p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint mb-4">
        Recommended hotels
      </p>
      <ul className="space-y-3">
        {hotels.map((hotel, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-text">{hotel.name}</p>
              <p className="text-xs text-text-muted">{hotel.tier} · {hotel.rating}</p>
            </div>
            <span className="font-mono-num text-text whitespace-nowrap text-right">
              {formatINR(hotel.estimatedCostNightUSD)}
              <span className="block text-[10px] text-text-faint font-sans">/night</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
