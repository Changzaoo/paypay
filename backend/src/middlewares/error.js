export const notFound = (req, res, next) => {
  const error = new Error("Rota não encontrada");
  error.status = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  const payload = {
    error: status >= 500 ? "Falha interna" : error.message
  };
  if (error.details && status < 500) payload.details = error.details;
  res.status(status).json(payload);
};
