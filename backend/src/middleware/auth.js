import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Replace requireRole in backend/src/middleware/auth.js with this:
export function requireRole(...allowedRoles) {
  // Flattens arrays or multiple role strings, e.g. ['engineer', 'authority']
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `This action requires one of these roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
}