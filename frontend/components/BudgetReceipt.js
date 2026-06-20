'use client';

import { formatINR } from '@/lib/format';

const ROWS = [
  { key: 'transport', label: 'Transport' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
];

export default function BudgetReceipt({ budget }) {
  if (!budget) return null;

  return (
    <div className="glass-soft p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint mb-4">
        Estimated budget
      </p>
      <dl className="space-y-2.5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-baseline text-sm">
            <dt className="text-text-muted">{row.label}</dt>
            <span className="leader" />
            <dd className="font-mono-num text-text">{formatINR(budget[row.key])}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-dashed border-glass-border-strong my-4" />
      <div className="flex items-baseline justify-between">
        <span className="font-display text-base font-semibold text-text">Total</span>
        <span className="font-mono-num text-xl font-semibold text-accent-strong">
          {formatINR(budget.total)}
        </span>
      </div>
    </div>
  );
}
