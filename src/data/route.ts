import type { LatLng } from '@/lib/geo';

/*
 * Approximate centre-line of the event's 2-hour loop on the Hong Kong Tramways network:
 * Whitty Street Tram Depot -> east along the main line to Causeway Bay -> round the Happy Valley
 * loop -> back west along the main line to Whitty Street. Coordinates are [lat, lng] and are good
 * enough for district detection; refine with real survey data if needed.
 *
 * The outbound and return legs share the same streets, so locating the tram relies on the
 * progress-aware snapping in src/lib/geo.ts.
 */

/** Main line from the depot to Canal Road, where the outbound and return legs part ways. */
const MAIN_LINE: LatLng[] = [
  [22.2866, 114.1365], // Whitty Street Tram Depot
  [22.2864, 114.139], // Sai Ying Pun
  [22.287, 114.1412], // Des Voeux Road West / Western Street
  [22.2873, 114.1445],
  [22.2872, 114.147],
  [22.287, 114.1504], // Western Market
  [22.2862, 114.1536], // Sheung Wan
  [22.2851, 114.1555],
  [22.284, 114.1565],
  [22.2822, 114.158], // Des Voeux Road Central / Pedder Street
  [22.2809, 114.1603], // Statue Square
  [22.2798, 114.1625],
  [22.2788, 114.165], // Admiralty
  [22.2774, 114.1671], // Pacific Place
  [22.2772, 114.169],
  [22.2775, 114.1722], // Hennessy Road / Luard Road
  [22.2777, 114.175], // Southorn Playground
  [22.2783, 114.1775],
  [22.2794, 114.1804], // Canal Road
];

const CAUSEWAY_BAY: LatLng[] = [
  [22.2803, 114.1846], // Causeway Bay / Yee Wo Street
  [22.2797, 114.1853],
  [22.279, 114.184], // Hennessy Road / Percival Street
  [22.2787, 114.1818], // Wong Nai Chung Road junction
];

const HAPPY_VALLEY_LOOP: LatLng[] = [
  [22.2775, 114.1818],
  [22.275, 114.1812],
  [22.272, 114.1808], // Racecourse (west side)
  [22.2695, 114.1815],
  [22.268, 114.1835],
  [22.2688, 114.1856], // Happy Valley terminus
  [22.2715, 114.186],
  [22.2745, 114.185],
  [22.277, 114.183],
  [22.2787, 114.1818], // Back at the junction
];

export const TRAM_ROUTE: LatLng[] = [
  ...MAIN_LINE,
  ...CAUSEWAY_BAY,
  ...HAPPY_VALLEY_LOOP,
  ...[...MAIN_LINE].reverse(),
];

export const MAP_CENTER: LatLng = [22.2795, 114.162];
