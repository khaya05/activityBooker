import { asyncWrapper } from '../util/asyncWrapper.js';
import { comparePassword, hashedPassword } from '../util/passwordUtil.js';
import User from '../models/userModel.js';
import { StatusCodes } from 'http-status-codes';
import { UnauthenticatedError } from '../errors/customErrors.js';
import { createToken } from '../util/tokenUtil.js';

export const register = asyncWrapper(async (req, res) => {
  const hashed = await hashedPassword(req.body.password);
  req.body.password = hashed;

  const user = await User.create(req.body);

  const { password: _pw, ...safeUser } = user.toObject();

  res.status(StatusCodes.CREATED).json({ user: safeUser });
});

export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  const isValid = user && (await comparePassword(password, user.password));
  if (!isValid) throw new UnauthenticatedError('Invalid credentials');

  const token = createToken({ userId: user._id, role: user.role });
  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const logout = (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(StatusCodes.OK).json({ msg: 'Logged out successfully' });
};