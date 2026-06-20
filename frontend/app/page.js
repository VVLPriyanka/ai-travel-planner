import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono-num text-xs uppercase tracking-[0.3em] text-brass-strong mb-4">
              Boarding Pass · Trip Generator
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight text-ink-text mb-6">
              Hand the planning to an agent.
              <br />
              <span className="text-brass-strong">Keep the souvenirs.</span>
            </h1>
            <p className="text-ink-text-muted text-lg mb-8 max-w-md">
              Tell it where, how long, and what you&apos;re into. The agent drafts a
              day-by-day itinerary, a realistic budget, hotel picks, and a packing
              list tuned to the destination&apos;s climate — all editable afterward.
            </p>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="px-5 py-3 rounded-md bg-brass text-ink font-medium hover:bg-brass-strong transition"
              >
                Plan your first trip
              </Link>
              <Link
                href="/login"
                className="px-5 py-3 rounded-md border border-ink-line text-ink-text hover:border-brass transition"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Hero ticket: a sample boarding pass illustrating the product */}
          <div className="ticket overflow-hidden">
            <div className="ticket-stripe" />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-paper-text-muted">Destination</p>
                  <p className="font-display text-2xl">Lisbon, Portugal</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-paper-text-muted">Duration</p>
                  <p className="font-mono-num text-2xl">5d</p>
                </div>
              </div>
              <div className="flex gap-2 mb-5">
                {['Food', 'Culture', 'Adventure'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] uppercase tracking-wide px-2 py-1 rounded border border-paper-line text-paper-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="perforation mb-5" />

              <p className="text-[11px] uppercase tracking-[0.2em] text-paper-text-muted mb-2">
                Day 1 · Morning
              </p>
              <p className="font-display text-lg mb-1">Alfama walking tour</p>
              <p className="text-sm text-paper-text-muted mb-4">
                Wind through the oldest district, fado echoing from open doorways.
              </p>

              <div className="flex justify-between items-center text-sm font-mono-num">
                <span className="text-paper-text-muted">Est. total budget</span>
                <span className="leader-paper leader" />
                <span className="text-lg">$1,180</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Day-by-day itinerary',
                body: 'A structured plan with morning, afternoon, and evening activities — add, remove, or regenerate any single day.',
              },
              {
                title: 'Realistic budget',
                body: 'Flights, stay, food, and activities estimated against your chosen budget tier, recalculated as you edit.',
              },
              {
                title: 'Weather-aware packing',
                body: 'A checklist built from your destination\u2019s climate and your planned activities — check items off as you pack.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-ink-line bg-ink-raised p-6">
                <h3 className="font-display text-lg text-brass-strong mb-2">{card.title}</h3>
                <p className="text-sm text-ink-text-muted">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-line py-6">
        <div className="max-w-6xl mx-auto px-6 text-xs text-ink-text-muted">
          Built for the Trao Full Stack Engineering Assessment.
        </div>
      </footer>
    </div>
  );
}
