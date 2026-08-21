export const sendSuccess = (res, { statusCode = 200, data = null, message = "OK", meta } = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
    ...(meta ? { meta } : {}),
  });
};
