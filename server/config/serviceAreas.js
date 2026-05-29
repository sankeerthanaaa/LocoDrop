// serviceAreas.js

/**
 * MVP Service Area Configuration
 *
 * Search can work across India,
 * but order creation is allowed only inside Telangana.
 */

export const allowedStates = [
  "telangana"
];

/**
 * Checks whether an address belongs to Telangana.
 *
 * Works with addresses like:
 * "Madhapur, Hyderabad, Telangana, India"
 * "Mancherial, Telangana, India"
 * "Warangal, Telangana, India"
 */

export function isAddressInServiceArea(address) {
  if (!address || typeof address !== "string") {
    return false;
  }

  const normalizedAddress = address.toLowerCase();

  return allowedStates.some((state) =>
    normalizedAddress.includes(state)
  );
}