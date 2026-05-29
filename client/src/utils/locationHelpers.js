/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * 
 * @param {{lat: number, lng: number}} point1
 * @param {{lat: number, lng: number}} point2
 * @returns {number} Distance in kilometers, rounded to 1 decimal place.
 */
export function calculateDistance(point1, point2) {
  if (
    !point1 || 
    !point2 || 
    typeof point1.lat !== 'number' || 
    typeof point1.lng !== 'number' ||
    typeof point2.lat !== 'number' || 
    typeof point2.lng !== 'number'
  ) {
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(1));
}
