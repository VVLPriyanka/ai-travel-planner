'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TripList from '@/components/TripList';
import TripForm from '@/components/TripForm';
import DayCard from '@/components/DayCard';
import BudgetReceipt from '@/components/BudgetReceipt';
import HotelList from '@/components/HotelList';
import PackingList from '@/components/PackingList';
import { useAuth } from '@/context/AuthContext';
import { fetchTrips, createTrip as createTripApi, deleteTrip as deleteTripApi } from '@/lib/api';

export default function DashboardPage() {
  const { user, token, ready } = useAuth();
  const router = useRouter();

  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Route guard: bounce unauthenticated visitors to /login once the
  // initial session check has finished.
  useEffect(() => {
    if (ready && !user) router.push('/login');
  }, [ready, user, router]);

  const loadTrips = useCallback(async () => {
    if (!token) return;
    setLoadingTrips(true);
    try {
      const data = await fetchTrips(token);
      setTrips(data);
      setSelected((prev) => {
        if (prev) {
          const stillExists = data.find((t) => t._id === prev._id);
          if (stillExists) return stillExists;
        }
        return data[0] || null;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTrips(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadTrips();
  }, [token, loadTrips]);

  async function handleCreateTrip(payload) {
    setCreating(true);
    setError('');
    try {
      const trip = await createTripApi(token, payload);
      setTrips((prev) => [trip, ...prev]);
      setSelected(trip);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTrip() {
    if (!selected) return;
    if (!window.confirm(`Delete the trip to ${selected.destination}? This can't be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteTripApi(token, selected._id);
      const remaining = trips.filter((t) => t._id !== selected._id);
      setTrips(remaining);
      setSelected(remaining[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // Used by every child component (DayCard, PackingList) to push a
  // server-returned trip back into local state after a mutation.
  function handleTripUpdate(updatedTrip) {
    setSelected(updatedTrip);
    setTrips((prev) => prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t)));
  }

  if (!ready || (ready && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Checking your session…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-text-faint mb-3">
            Your trips
          </h2>
          {loadingTrips ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : (
            <TripList trips={trips} selectedId={selected?._id} onSelect={setSelected} onNew={() => setShowForm(true)} />
          )}
        </aside>

        {/* Main panel */}
        <section>
          {error && (
            <p className="mb-4 text-sm text-bad bg-bad/10 border border-bad/30 rounded-xl px-3 py-2">{error}</p>
          )}

          {showForm && (
            <div className="mb-8 max-w-md">
              <TripForm onSubmit={handleCreateTrip} onCancel={() => setShowForm(false)} submitting={creating} />
            </div>
          )}

          {!showForm && !selected && !loadingTrips && (
            <div className="glass !border-dashed p-10 text-center">
              <p className="font-display text-xl font-semibold text-text mb-2">No trip selected yet</p>
              <p className="text-sm text-text-muted mb-5">
                Create your first itinerary and the agent will draft the rest.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-pill btn-pill-primary"
              >
                + New trip
              </button>
            </div>
          )}

          {!showForm && selected && (
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-3xl font-semibold text-text">{selected.destination}</h1>
                  <p className="text-sm text-text-muted mt-1">
                    {selected.durationDays} days · {selected.budgetTier} budget
                    {selected.interests?.length > 0 && ` · ${selected.interests.join(', ')}`}
                  </p>
                  {selected.generationSource === 'mock' && (
                    <p className="text-xs text-accent-strong mt-2">
                      Generated in demo mode (no Gemini API key configured) — sample data, not a live AI call.
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDeleteTrip}
                  disabled={deleting}
                  className="text-xs text-text-muted hover:text-bad transition disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Delete trip'}
                </button>
              </div>

              <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-6">
                  {selected.itinerary.map((day) => (
                    <DayCard
                      key={day.dayNumber}
                      day={day}
                      trip={selected}
                      token={token}
                      onTripUpdate={handleTripUpdate}
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  <BudgetReceipt budget={selected.estimatedBudget} />
                  <HotelList hotels={selected.hotels} />
                  <PackingList trip={selected} token={token} onTripUpdate={handleTripUpdate} />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
