/**
 * Camada de armazenamento. Hoje usa localStorage; para migrar para o Supabase
 * basta reimplementar estas funções mantendo a mesma assinatura.
 */
import type { Trip } from "@/types/trip";
import { demoTrip } from "@/data/demo";

const KEY = "routeasy:trips:v1";
const SEED_KEY = "routeasy:seeded:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): Trip[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const trips: Trip[] = raw ? JSON.parse(raw) : [];
    if (!window.localStorage.getItem(SEED_KEY)) {
      window.localStorage.setItem(SEED_KEY, "1");
      if (!trips.some((t) => t.id === demoTrip.id)) {
        trips.push(demoTrip);
        writeAll(trips);
      }
    }
    return trips;
  } catch {
    return [];
  }
}

function writeAll(trips: Trip[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(trips));
}

export const tripStorage = {
  list(): Trip[] {
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string): Trip | undefined {
    return readAll().find((t) => t.id === id);
  },
  getByToken(token: string): Trip | undefined {
    return readAll().find((t) => t.shareToken === token);
  },
  save(trip: Trip): Trip {
    const trips = readAll();
    const next = { ...trip, updatedAt: new Date().toISOString() };
    const index = trips.findIndex((t) => t.id === trip.id);
    if (index >= 0) trips[index] = next;
    else trips.push(next);
    writeAll(trips);
    return next;
  },
  remove(id: string) {
    writeAll(readAll().filter((t) => t.id !== id));
  },
  duplicate(id: string): Trip | undefined {
    const trip = readAll().find((t) => t.id === id);
    if (!trip) return undefined;
    const copy: Trip = {
      ...trip,
      id: createId(),
      title: `${trip.title} (cópia)`,
      shareToken: createShareToken(),
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeAll([...readAll(), copy]);
    return copy;
  },
};

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/** Token de compartilhamento longo e difícil de adivinhar. */
export function createShareToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Codifica a viagem no próprio link (compartilhamento sem banco de dados). */
export function encodeTrip(trip: Trip): string {
  const json = JSON.stringify(trip);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeTrip(encoded: string): Trip | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Trip;
  } catch {
    return null;
  }
}
