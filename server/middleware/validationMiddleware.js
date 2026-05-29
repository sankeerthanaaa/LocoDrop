import { isValidObjectId } from '../utils/objectId.js';

export const sendValidationError = (res, errors) =>
  res.status(400).json({
    message: 'Validation failed',
    errors,
  });

export const validateRequest = (validators) => (req, res, next) => {
  const errors = validators
    .map((validator) => validator(req))
    .flat()
    .filter(Boolean);

  if (errors.length) {
    return sendValidationError(res, errors);
  }

  next();
};

export const validateObjectIdParam = (paramName = 'id') =>
  validateRequest([
    (req) =>
      isValidObjectId(req.params[paramName])
        ? null
        : { field: paramName, message: `${paramName} must be a valid ObjectId` },
  ]);
