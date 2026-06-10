import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  // Read JWT from HttpOnly cookie (secure) with header fallback for tests/CLI
  const token = req.cookies?.token || (() => {
    const h = req.headers.authorization;
    return h?.startsWith('Bearer ') ? h.split(' ')[1] : null;
  })();

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
