export const toGeoPoint = ({ lat, lng }) => ({
  type: 'Point',
  coordinates: [Number(lng), Number(lat)],
});
