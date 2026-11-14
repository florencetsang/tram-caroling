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

export function snapToRoute(route: RouteIndex, p: LatLng): Snap {
  const [px, py] = project(p, route.lat0);
  let best: Snap = { along: 0, distance: Infinity, point: route.points[0] };
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
    if (d < best.distance) {
      best = {
        along: route.cum[i] + t * Math.sqrt(len2),
        distance: d,
        point: unproject([sx, sy], route.lat0),
      };
    }
  }
  return best;
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

/** Turns district start points into contiguous spans along the route. */
export function buildDistrictSpans(
  route: RouteIndex,
  districts: { id: string; start_lat: number; start_lng: number }[],
): DistrictSpan[] {
  const starts = districts
    .map((d) => ({ id: d.id, start: snapToRoute(route, [d.start_lat, d.start_lng]).along }))
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
