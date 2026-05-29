import jwt from 'jsonwebtoken';
import User, { USER_ROLES } from '../models/User.js';
import { authErrorCodes, sendAuthError } from '../utils/authErrors.js';
import { isValidObjectId } from '../utils/objectId.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendAuthError(res, 401, 'No token, authorization denied', authErrorCodes.TOKEN_MISSING);
  }

  if (!process.env.JWT_SECRET) {
    return sendAuthError(res, 500, 'JWT secret is not configured', authErrorCodes.JWT_SECRET_MISSING);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || !isValidObjectId(decoded.id)) {
      return sendAuthError(res, 401, 'Token payload is invalid', authErrorCodes.TOKEN_INVALID);
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendAuthError(res, 401, 'User no longer exists', authErrorCodes.USER_NOT_FOUND);
    }

    if (!USER_ROLES.includes(user.role)) {
      return sendAuthError(res, 403, 'User role is invalid', authErrorCodes.ROLE_INVALID);
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    req.currentUser = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return sendAuthError(res, 401, 'Token has expired', authErrorCodes.TOKEN_EXPIRED);
    }

    return sendAuthError(res, 401, 'Token is invalid', authErrorCodes.TOKEN_INVALID);
  }
};
