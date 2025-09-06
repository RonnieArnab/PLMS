import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    // 1. Extract token from "Authorization: Bearer <token>"
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 2. Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      // 3. Attach decoded payload to req.user
      req.user = decoded;
      next();
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
