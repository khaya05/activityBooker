import { UnauthenticatedError, Unauthorized } from '../errors/customErrors.js';
import { verifyJWT } from '../util/tokenUtil.js';

export const authenticateUser = (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return next(new UnauthenticatedError('Authentication invalid'));

  try {
    const { userId, role } = verifyJWT(token);
    req.user = { userId, role };
    next();
  } catch {
    next(new UnauthenticatedError('Authentication invalid'));
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new Unauthorized(`Role '${req.user?.role}' is not authorized for this action`));
  }
  next();
};