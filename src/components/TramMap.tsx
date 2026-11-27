'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import { MAP_CENTER } from '@/data/route';
import { sliceRoute, type DistrictSpan, type LatLng, type RouteIndex } from '@/lib/geo';
import type { District } from '@/lib/types';

interface Props {
  route: RouteIndex;
  spans: DistrictSpan[];
  districts: District[];
  currentDistrictId: string | null;
  tramPoint: LatLng | null;
  userPoint: LatLng | null;
  follow: boolean;
  onSelectDistrict?: (id: string) => void;
}

const COLORS = ['#123d33', '#4f8a72'];

export default function TramMap({
  route,
  spans,
  districts,
  currentDistrictId,
  tramPoint,
  userPoint,
  follow,
  onSelectDistrict,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const routeLayer = useRef<LayerGroup | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const selectRef = useRef(onSelectDistrict);
  selectRef.current = onSelectDistrict;

  // Leaflet touches `window`, so load it on the client only.
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      const L = (mod as unknown as { default?: typeof import('leaflet') }).default ?? mod;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(MAP_CENTER, 13);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      routeLayer.current = L.layerGroup().addTo(map);
      markerLayer.current = L.layerGroup().addTo(map);
      map.fitBounds(L.latLngBounds(route.points), { padding: [16, 16] });
      mapRef.current = map;
      drawRoute();
      drawMarkers();
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawRoute() {
    const L = LRef.current;
    const layer = routeLayer.current;
    if (!L || !layer) return;
    layer.clearLayers();
    // Draw the current district last so it sits on top where the outbound and return legs overlap.
    const order = spans
      .map((span, i) => ({ span, i }))
      .sort((a, b) => Number(a.span.id === currentDistrictId) - Number(b.span.id === currentDistrictId));
    order.forEach(({ span, i }) => {
      const isCurrent = span.id === currentDistrictId;
      const district = districts.find((d) => d.id === span.id);
      const line = L.polyline(sliceRoute(route, span.start, span.end), {
        color: isCurrent ? '#b08d57' : COLORS[i % COLORS.length],
        weight: isCurrent ? 9 : 6,
        opacity: isCurrent ? 1 : 0.75,
      });
      if (district) {
        line.bindTooltip(district.name, { sticky: true });
        line.on('click', () => selectRef.current?.(district.id));
      }
      line.addTo(layer);
    });
  }

  function drawMarkers() {
    const L = LRef.current;
    const layer = markerLayer.current;
    if (!L || !layer) return;
    layer.clearLayers();
    if (userPoint) {
      L.circleMarker(userPoint, { radius: 7, color: '#fff', weight: 2, fillColor: '#123d33', fillOpacity: 1 })
        .bindTooltip('You')
        .addTo(layer);
    }
    if (tramPoint) {
      L.circleMarker(tramPoint, { radius: 11, color: '#d2b886', weight: 3, fillColor: '#0b2e28', fillOpacity: 1 })
        .bindTooltip('Tram', { permanent: false })
        .addTo(layer);
      if (follow && mapRef.current) mapRef.current.panTo(tramPoint, { animate: true });
    }
  }

  useEffect(drawRoute, [route, spans, districts, currentDistrictId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(drawMarkers, [tramPoint, userPoint, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="h-64 w-full overflow-hidden rounded-xl sm:h-80" aria-label="Tram route map" />;
}
