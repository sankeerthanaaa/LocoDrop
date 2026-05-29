/**
 * Calculates straight-line distance between two coordinates in meters using the Haversine formula.
 * Used as a fallback on OSRM API failures.
 */
function calculateDirectDistance(p1, p2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (p1.lat * Math.PI) / 180;
  const phi2 = (p2.lat * Math.PI) / 180;
  const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Queries OSRM road routing distance in meters, falling back to direct Haversine distance on failures.
 */
async function getRouteDistance(p1, p2) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM responded with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distance; // distance in meters
    }
    throw new Error('No routes returned from OSRM.');
  } catch (error) {
    console.warn('OSRM route distance query failed, using direct fallback:', error.message);
    return calculateDirectDistance(p1, p2);
  }
}

/**
 * Computes the MVP delivery fee according to flat rates and distance multipliers:
 * - 0m - 800m: ₹20 flat fee
 * - > 800m: ₹20 + (Distance in KM * ₹8)
 * Rounds to the nearest whole Rupee.
 *
 * @param {number} distanceMeters
 * @returns {number} Rounded delivery fee in Rupees
 */
export function calculateMVPFee(distanceMeters) {
  if (distanceMeters <= 800) {
    return 20;
  }
  const distanceKm = distanceMeters / 1000;
  const fee = 20 + distanceKm * 8;
  return Math.round(fee);
}

/**
 * Calculates delivery fee details. Can accept direct distance in meters,
 * or starting & destination coordinates to fetch precise road routes.
 *
 * @param {number|{lat: number, lng: number}} arg1 - Distance in meters OR pickup coordinates
 * @param {{lat: number, lng: number}} [arg2] - Drop coordinates (required if arg1 is coordinate object)
 * @returns {Promise<{distanceMeters: number, distanceKm: number, deliveryFee: number}>}
 */
export async function calculateDeliveryFee(arg1, arg2) {
  let distanceMeters;

  if (typeof arg1 === 'number') {
    distanceMeters = arg1;
  } else if (arg1 && arg2 && typeof arg1.lat === 'number' && typeof arg2.lat === 'number') {
    distanceMeters = await getRouteDistance(arg1, arg2);
  } else {
    throw new Error('Invalid arguments provided to delivery fee calculator.');
  }

  const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
  const deliveryFee = calculateMVPFee(distanceMeters);

  return {
    distanceMeters: Math.round(distanceMeters),
    distanceKm,
    deliveryFee,
  };
}
