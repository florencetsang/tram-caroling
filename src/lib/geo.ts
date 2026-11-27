export type LatLng = [number, number];

const EARTH_RADIUS_M = 6371000;
const DEG = Math.PI / 180;

export interface RouteIndex {
  points: LatLng[];
  xy: [number, number][];
  /** Cumulative distance (m) from the start of the route to each vertex. */
  cum: number[];
  length: number;
  lat0: number;
}

export interface Snap {
  /** Distance along the route in metres. */
  along: number;
  /** Distance from the input point to the route in metres. */
  distance: number;
  point: LatLng;
}

// Equirectangular projection: accurate to well under 1% over a few kilometres.
function project([lat, lng]: LatLng, lat0: number): [number, number] {
  return [lng * DEG * EARTH_RADIUS_M * Math.cos(lat0 * DEG), lat * DEG * EARTH_RADIUS_M];
}

function unproject([x, y]: [number, number], lat0: number): LatLng {
  return [y / EARTH_RADIUS_M / DEG, x / (EARTH_RADIUS_M * Math.cos(lat0 * DEG)) / DEG];
}

export function buildRouteIndex(points: LatLng[]): RouteIndex {
  const lat0 = points.reduce((s, p) => s + p[0], 0) / Math.max(points.length, 1);
  const xy = points.map((p) => project(p, lat0));
  const cum = [0];
  for (let i = 1; i < xy.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  }
  return { points, xy, cum, length: cum[cum.length - 1] ?? 0, lat0 };
}

/** Snaps within this distance (m) of the closest one count as "also on the line here". */
const SNAP_TOLERANCE_M = 40;
/** Candidates closer together than this (m along the route) belong to the same pass. */
const PASS_GAP_M = 150;
/** How far (m) the tram may appear to slip backwards (GPS jitter) and stay on the same pass. */
const BACKTRACK_M = 150;

/**
 * Snaps a point to the route. Where the route passes the same place more than once (e.g. the
 * outbound and return legs of a loop), `hintAlong` — the last known position along the route —
 * picks the pass at or just ahead of it. Without a hint, the earliest pass wins.
 */
export function snapToRoute(route: RouteIndex, p: LatLng, hintAlong?: number | null): Snap {
  const [px, py] = project(p, route.lat0);
  const candidates: Snap[] = [];
  let bestDistance = Infinity;
  for (let i = 0; i < route.xy.length - 1; i++) {
    const [ax, ay] = route.xy[i];
    const [bx, by] = route.xy[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const sx = ax + t * dx;
    const sy = ay + t * dy;
    const d = Math.hypot(px - sx, py - sy);
    bestDistance = Math.min(bestDistance, d);
    candidates.push({ along: route.cum[i] + t * Math.sqrt(len2), distance: d, point: [sx, sy] });
  }
  if (!candidates.length) return { along: 0, distance: Infinity, point: route.points[0] };

  const near = candidates
    .filter((c) => c.distance <= bestDistance + SNAP_TOLERANCE_M)
    .sort((a, b) => a.along - b.along);
  const passes: Snap[][] = [];
  for (const c of near) {
    const last = passes[passes.length - 1];
    if (last && c.along - last[last.length - 1].along <= PASS_GAP_M) last.push(c);
    else passes.push([c]);
  }
  const pass =
    hintAlong == null
      ? passes[0]
      : (passes.find((ps) => ps[ps.length - 1].along >= hintAlong - BACKTRACK_M) ?? passes[passes.length - 1]);
  const best = pass.reduce((a, b) => (b.distance < a.distance ? b : a));
  return { ...best, point: unproject(best.point, route.lat0) };
}

export function pointAt(route: RouteIndex, along: number): LatLng {
  const a = Math.max(0, Math.min(route.length, along));
  for (let i = 0; i < route.cum.length - 1; i++) {
    if (a <= route.cum[i + 1]) {
      const segLen = route.cum[i + 1] - route.cum[i];
      const t = segLen === 0 ? 0 : (a - route.cum[i]) / segLen;
      const [ax, ay] = route.xy[i];
      const [bx, by] = route.xy[i + 1];
      return unproject([ax + t * (bx - ax), ay + t * (by - ay)], route.lat0);
    }
  }
  return route.points[route.points.length - 1];
}

/** Portion of the route between two along-distances, as a polyline. */
export function sliceRoute(route: RouteIndex, from: number, to: number): LatLng[] {
  const out: LatLng[] = [pointAt(route, from)];
  for (let i = 0; i < route.cum.length; i++) {
    if (route.cum[i] > from && route.cum[i] < to) out.push(route.points[i]);
  }
  out.push(pointAt(route, to));
  return out;
}

export interface DistrictSpan {
  id: string;
  start: number;
  end: number;
}

/**
 * Turns district start points into contiguous spans along the route. Districts are placed in
 * `sort_order`, each one snapped at or after the previous one, so a district on the return leg of
 * a loop lands on the return leg even when it shares streets with the outbound leg.
 */
export function buildDistrictSpans(
  route: RouteIndex,
  districts: { id: string; start_lat: number; start_lng: number; sort_order?: number }[],
): DistrictSpan[] {
  let hint: number | null = null;
  const starts = [...districts]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((d) => {
      const start = snapToRoute(route, [d.start_lat, d.start_lng], hint).along;
      hint = start;
      return { id: d.id, start };
    })
    .sort((a, b) => a.start - b.start);
  return starts.map((s, i) => ({
    id: s.id,
    start: i === 0 ? 0 : s.start,
    end: i === starts.length - 1 ? route.length : starts[i + 1].start,
  }));
}

export function districtAt(spans: DistrictSpan[], along: number): string | null {
  for (let i = spans.length - 1; i >= 0; i--) {
    if (along >= spans[i].start) return spans[i].id;
  }
  return spans[0]?.id ?? null;
}
