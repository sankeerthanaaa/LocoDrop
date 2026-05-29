const emailRegex = /^(?=.{6,254}$)(?=.{2,64}@)[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])@(?=.{4,253}$)(?=.*[a-z])(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const alphaNameRegex = /^[A-Za-z][A-Za-z ]{1,79}$/;
const phoneRegex = /^\+?[1-9]\d{9,14}$/;

export const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

export const isValidEmail = (email) => emailRegex.test(normalizeEmail(email));

export const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

export const isValidAlphaName = (name) =>
  isNonEmptyString(name) &&
  alphaNameRegex.test(name.trim()) &&
  /[A-Za-z]/.test(name) &&
  !/^\d+$/.test(name.trim());

export const normalizePhone = (phone) =>
  typeof phone === 'string' ? phone.trim().replace(/[\s-]/g, '') : '';

export const isValidPhone = (phone) => {
  if (phone == null || phone === '') return true;
  return phoneRegex.test(normalizePhone(phone));
};

export const isValidPrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) && numericPrice > 0 && numericPrice <= 100000;
};

export const isValidLatitude = (lat) => {
  const numericLat = Number(lat);
  return Number.isFinite(numericLat) && numericLat >= -90 && numericLat <= 90;
};

export const isValidLongitude = (lng) => {
  const numericLng = Number(lng);
  return Number.isFinite(numericLng) && numericLng >= -180 && numericLng <= 180;
};

export const validatePasswordStrength = (password) => {
  const errors = [];

  if (typeof password !== 'string') {
    return ['Password is required'];
  }

  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter');
  if (!/\d/.test(password)) errors.push('Password must include a number');

  return errors;
};
