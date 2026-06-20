import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 pt-24 sm:pt-32 pb-24 text-center flex flex-col items-center">
          <span className="badge-pill mb-7">
            <span aria-hidden="true">✨</span> AI-Powered Trip Planning
          </span>

          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.08] text-text mb-6 text-balance">
            Your AI trip planner
            <br />
            with a real itinerary
          </h1>

          <p className="text-text-muted text-lg max-w-xl mb-10">
            Tell it where, how long, and what you&apos;re into. Get a day-by-day
            plan, a realistic budget in dollars, hotel picks, and a packing list
            tuned to the climate — all editable afterward.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-pill btn-pill-primary !px-7 !py-3.5 text-base">
              Plan your first trip
            </Link>
            <Link href="/login" className="btn-pill btn-pill-glass !px-7 !py-3.5 text-base">
              Sign in
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: '🗓️',
                title: 'Day-by-day itinerary',
                body: 'A structured plan with morning, afternoon, and evening activities — add, remove, or regenerate any single day.',
              },
              {
                icon: '$',
                title: 'Realistic budget',
                body: 'Flights, stay, food, and activities estimated in dollars against your chosen budget tier, recalculated as you edit.',
              },
              {
                icon: '🧳',
                title: 'Weather-aware packing',
                body: "A checklist built from your destination's climate and your planned activities — check items off as you pack.",
              },
            ].map((card) => (
              <div key={card.title} className="glass p-6">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-glass-border flex items-center justify-center text-lg mb-4">
                  {card.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-text mb-2">{card.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-6 py-8">
        <div className="max-w-5xl mx-auto text-xs text-text-faint text-center">
          Built for the Trao Full Stack Engineering Assessment.
        </div>
      </footer>
    </div>
  );
}
