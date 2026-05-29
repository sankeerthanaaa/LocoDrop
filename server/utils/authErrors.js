export const sendAuthError = (res, status, message, code) =>
  res.status(status).json({
    message,
    ...(code ? { code } : {}),
  });

export const authErrorCodes = {
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ROLE_INVALID: 'ROLE_INVALID',
  JWT_SECRET_MISSING: 'JWT_SECRET_MISSING',
};
