/**
 * Fetches real road routing geometry, distance, and duration between two coordinates
 * using the public OpenStreetMap OSRM API.
 * Falls back to a direct straight line route if the API is down or coordinates are unreachable.
 * 
 * @param {{lat: number, lng: number}} startCoords - Starting coordinates.
 * @param {{lat: number, lng: number}} endCoords - Destination coordinates.
 * @returns {Promise<{coordinates: Array<[number, number]>, distance: number, duration: number}>}
 */
export async function fetchRoute(startCoords, endCoords) {
  if (!startCoords || !endCoords) {
    throw new Error('Start and end coordinates are required.');
  }

  const fallbackRoute = {
    coordinates: [
      [startCoords.lat, startCoords.lng],
      [endCoords.lat, endCoords.lng],
    ],
    distance: calculateDirectDistance(startCoords, endCoords), // approximate distance in meters
    duration: Math.round(calculateDirectDistance(startCoords, endCoords) / 10), // approximate duration in seconds (assuming 36 km/h)
  };

  try {
    // Note: OSRM uses [lng, lat] coordinate pairs separated by semicolons
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM service responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes returned by OSRM.');
    }

    const route = data.routes[0];
    const geometry = route.geometry;

    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
      throw new Error('Invalid route geometry returned.');
    }

    // Convert GeoJSON [lng, lat] coordinates back to Leaflet [lat, lng] format
    const leafletCoords = geometry.coordinates.map((coord) => [coord[1], coord[0]]);

    return {
      coordinates: leafletCoords,
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
    };
  } catch (error) {
    console.warn('OSRM routing failed. Falling back to straight line route:', error.message);
    return fallbackRoute;
  }
}

/**
 * Calculates direct distance between two points in meters using the Haversine formula.
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
