/**
 * Geocodes an address string into latitude and longitude coordinates.
 * Utilizes the OpenStreetMap Nominatim API.
 * 
 * @param {string} address - The address to geocode.
 * @returns {Promise<{lat: number, lng: number}>} - Object containing lat and lng.
 */
export async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    throw new Error('Address string cannot be empty.');
  }

  // Address quality improvement:
  // If the query doesn't contain "Hyderabad" (case-insensitive), append " Hyderabad" to improve hyper-local routing accuracy.
  let improvedQuery = address.trim();
  if (!/hyderabad/i.test(improvedQuery)) {
    improvedQuery = `${improvedQuery} Hyderabad`;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(improvedQuery)}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding server responded with status: ${response.status}`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      throw new Error(`Could not find the address: "${address}". Please try a more specific address.`);
    }

    const { lat, lon } = results[0];
    
    if (!lat || !lon) {
      throw new Error('Invalid coordinate structure returned from geocoding service.');
    }

    return {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
    };
  } catch (error) {
    console.error('Error during geocoding:', error);
    throw error;
  }
}
