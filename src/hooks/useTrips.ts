import { useCallback, useEffect, useState } from "react";
import { tripStorage } from "@/services/storage";
import type { Trip } from "@/types/trip";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setTrips(tripStorage.list());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trips, loading, refresh };
}

export function useTrip(id: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTrip(tripStorage.get(id) ?? null);
    setLoading(false);
  }, [id]);

  const update = useCallback((next: Trip) => {
    const saved = tripStorage.save(next);
    setTrip(saved);
    return saved;
  }, []);

  return { trip, loading, update, setTrip };
}
