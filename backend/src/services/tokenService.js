// backend/src/services/tokenService.js
import jwt from "jsonwebtoken";

export function createEmailVerificationToken(userId) {
  return jwt.sign({ userId }, process.env.EMAIL_VERIFY_SECRET, {
    expiresIn: "1d",
  });
}

export function verifyEmailVerificationToken(token) {
  try {
    return jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);
  } catch (err) {
    return null;
  }
}
