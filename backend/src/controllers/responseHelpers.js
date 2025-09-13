// controllers/responseHelpers.js
export function badRequest(res, message = "Bad request", fields = {}) {
  return res.status(400).json({ error: message, errors: fields });
}

export function conflict(res, message = "Conflict", fields = {}) {
  return res.status(409).json({ error: message, errors: fields });
}

export function notFound(res, message = "Not found") {
  return res.status(404).json({ error: message });
}

export function serverError(res, message = "Internal server error") {
  return res.status(500).json({ error: message });
}
