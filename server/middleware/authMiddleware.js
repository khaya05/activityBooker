import { UnauthenticatedError } from '../errors/customErrors.js';
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
    next(new UnauthenticatedError('Authentication invalid'));
  }
};