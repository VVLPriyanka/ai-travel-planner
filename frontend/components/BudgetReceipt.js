'use client';

const ROWS = [
  { key: 'transport', label: 'Transport' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
];

export default function BudgetReceipt({ budget }) {
  if (!budget) return null;

  return (
    <div className="rounded-xl border border-ink-line bg-ink-raised p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-text-muted mb-4">
        Estimated budget
      </p>
      <dl className="space-y-2.5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-baseline text-sm">
            <dt className="text-ink-text-muted">{row.label}</dt>
            <span className="leader" />
            <dd className="font-mono-num">${(budget[row.key] || 0).toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <div className="perforation my-4" />
      <div className="flex items-baseline justify-between">
        <span className="font-display text-base">Total</span>
        <span className="font-mono-num text-xl text-brass-strong">
          ${(budget.total || 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
