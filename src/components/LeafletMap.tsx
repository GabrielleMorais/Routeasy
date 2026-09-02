/**
 * Mapa interativo (client-only) com Leaflet + tiles do OpenStreetMap.
 * Recebe apenas dados já calculados, o que permite trocar a implementação por
 * Google Maps/Mapbox futuramente sem alterar quem o utiliza.
 */
import { useEffect, useRef } from "react";
import type { Map as LeafletMapInstance } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_ATTRIBUTION } from "@/services/maps";

export interface MapStop {
  id: string;
  order: number;
  name: string;
  address: string;
  time?: string;
  latitude: number;
  longitude: number;
  color: string;
}

export interface MapRoute {
  id: string;
  color: string;
  dashed?: boolean;
  coordinates: [number, number][];
}

interface Props {
  accommodation: { latitude: number; longitude: number; address: string };
  stops: MapStop[];
  routes: MapRoute[];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

export default function LeafletMap({ accommodation, stops, routes }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView(
      [accommodation.latitude, accommodation.longitude],
      13,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    routes.forEach((route) => {
      if (route.coordinates.length < 2) return;
      L.polyline(route.coordinates, {
        color: route.color,
        weight: 5,
        opacity: 0.85,
        ...(route.dashed ? { dashArray: "8 8" } : {}),
      }).addTo(layer);
    });

    const home = L.divIcon({
      className: "",
      html: `<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:9999px;background:var(--foreground);color:var(--background);font-size:16px;box-shadow:0 6px 16px rgb(0 0 0 / 0.25)">&#9873;</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    L.marker([accommodation.latitude, accommodation.longitude], { icon: home })
      .bindPopup(`<strong>Hospedagem</strong><br/>${escapeHtml(accommodation.address)}`)
      .addTo(layer);

    stops.forEach((stop) => {
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9999px;border:2px solid var(--background);background:${stop.color};color:var(--background);font-size:13px;font-weight:700;box-shadow:0 6px 16px rgb(0 0 0 / 0.25)">${stop.order}</span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([stop.latitude, stop.longitude], { icon })
        .bindPopup(
          `<strong>${stop.order}. ${escapeHtml(stop.name)}</strong><br/>${escapeHtml(stop.address)}${
            stop.time ? `<br/>${escapeHtml(stop.time)}` : ""
          }`,
        )
        .addTo(layer);
    });

    const points: [number, number][] = [
      [accommodation.latitude, accommodation.longitude],
      ...stops.map((s) => [s.latitude, s.longitude] as [number, number]),
    ];
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points).pad(0.15));
    } else {
      map.setView(points[0]!, 14);
    }
    map.invalidateSize();
  }, [accommodation, stops, routes]);

  return <div ref={containerRef} className="size-full" aria-label="Mapa do roteiro" />;
}
