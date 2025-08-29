export function notFound(req, res, next) {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Internal Server Error'
  };
  if (req.app.get('env') === 'development') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}
