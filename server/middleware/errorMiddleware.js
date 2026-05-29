export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;
  const response = {
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  console.error('Unhandled error:', err);
  res.status(statusCode).json(response);
};
