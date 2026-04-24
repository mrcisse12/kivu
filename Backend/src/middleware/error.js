const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route non trouvée: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const status = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { notFound, errorHandler };
