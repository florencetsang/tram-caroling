import type { LatLng } from '@/lib/geo';

/**
 * Approximate centre-line of the Hong Kong Tramways main line on Hong Kong Island,
 * Kennedy Town (west) to Shau Kei Wan (east). Coordinates are [lat, lng] and are
 * good enough for district detection; refine with real survey data if needed.
 */
export const TRAM_ROUTE: LatLng[] = [
  [22.28318, 114.12724], // Kennedy Town terminus
  [22.2822, 114.1288], // Catchick Street
  [22.2834, 114.1306],
  [22.2849, 114.1335], // Belcher's Street / Hill Road
  [22.2857, 114.1362],
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
  [22.2803, 114.1846], // Causeway Bay / Yee Wo Street
  [22.2812, 114.1868],
  [22.2822, 114.189], // Victoria Park / Causeway Road
  [22.2832, 114.1918], // Tin Hau
  [22.2855, 114.1931],
  [22.2878, 114.1944], // Fortress Hill
  [22.2895, 114.1972],
  [22.291, 114.1998], // North Point
  [22.2912, 114.203],
  [22.2902, 114.2068],
  [22.2889, 114.2095],
  [22.2872, 114.2125], // Quarry Bay
  [22.2853, 114.2165], // Taikoo Place
  [22.2838, 114.2195],
  [22.2824, 114.222], // Sai Wan Ho
  [22.2811, 114.2243],
  [22.2798, 114.2265], // Shau Kei Wan Road
  [22.2782, 114.2299], // Shau Kei Wan terminus
];

export const MAP_CENTER: LatLng = [22.2835, 114.178];
