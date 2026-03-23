import { UnauthenticatedError, Unauthorized } from '../errors/customErrors.js';
import { verifyJWT } from '../util/tokenUtil.js';

export const authenticateUser = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new UnauthenticatedError('Authentication invalid'));
  }

  try {
    const { userId, role } = verifyJWT(token);
    req.user = { userId, role };
    next();
  } catch (error) {
    // Covers expired tokens, bad signatures, malformed JWTs
    next(new UnauthenticatedError('Authentication invalid'));
  }
};

// ─── Role guard ───────────────────────────────────────────
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new Unauthorized(`Role '${req.user.role}' is not authorized for this action`));
  }
  next();
};