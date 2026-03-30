import { asyncWrapper } from '../util/asyncWrapper.js';
import { comparePassword, hashedPassword } from '../util/passwordUtil.js';
import { createToken } from '../util/tokenUtil.js';
import User from '../models/userModel.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError, UnauthenticatedError } from '../errors/customErrors.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService.js';

// ─── Sync helper — defined here to avoid any import confusion ─
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
}

// ─── Register ──────────────────────────────────────────────
export const register = asyncWrapper(async (req, res) => {
  const { password, ...rest } = req.body;

  const verificationCode = generateVerificationCode(); // sync — plain string
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    ...rest,
    password: await hashedPassword(password),
    verificationCode,
    verificationCodeExpires,
    emailVerified: false,
    authProvider: 'email',
  });

  sendVerificationEmail(user.email, verificationCode).catch((err) =>
    console.error('[auth] Verification email failed:', err?.message)
  );

  const token = createToken({ userId: user._id });
  setAuthCookie(res, token);

  res.status(StatusCodes.CREATED).json({
    message: 'Registration successful. Check your email for a verification code.',
    token,
    user: {
      userId: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  });
});

// ─── Verify email ──────────────────────────────────────────
export const verifyEmail = asyncWrapper(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+verificationCode +verificationCodeExpires'
  );

  if (!user) throw new NotFoundError('User not found');
  if (user.emailVerified) {
    return res.status(StatusCodes.OK).json({ message: 'Email already verified.' });
  }
  if (!user.verificationCode || user.verificationCodeExpires < new Date()) {
    throw new BadRequestError('Verification code has expired. Request a new one.');
  }
  if (user.verificationCode !== code) {
    throw new BadRequestError('Invalid verification code.');
  }

  user.emailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error('[auth] Welcome email failed:', err?.message)
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Email verified successfully.',
    user: {
      userId: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  });
});

// ─── Resend verification ───────────────────────────────────
export const resendVerificationCode = asyncWrapper(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) throw new NotFoundError('User not found');
  if (user.emailVerified) throw new BadRequestError('Email is already verified');

  const verificationCode = generateVerificationCode();
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  sendVerificationEmail(email, verificationCode).catch((err) =>
    console.error('[auth] Resend failed:', err?.message)
  );

  res.status(StatusCodes.OK).json({ success: true, message: 'Verification code sent.' });
});

// ─── Login ─────────────────────────────────────────────────
export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  const isValid = user && (await comparePassword(password, user.password));
  if (!isValid) throw new UnauthenticatedError('Invalid credentials');

  if (!user.emailVerified) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Please verify your email before logging in.',
      requiresVerification: true,
      email: user.email,
    });
  }

  const token = createToken({ userId: user._id, role: user.role });
  setAuthCookie(res, token);

  res.status(StatusCodes.OK).json({
    msg: 'Logged in successfully',
    token,
    user: {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });
});

// ─── Google auth ───────────────────────────────────────────
export const googleAuth = asyncWrapper(async (req, res) => {
  const { googleId, name, email } = req.body;

  if (!googleId || !email || !name) {
    throw new BadRequestError('Missing required Google auth data (googleId, name, email)');
  }

  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.emailVerified = true;
      user.authProvider = 'google';
      await user.save();
    }
  } else {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId,
      emailVerified: true,
      authProvider: 'google',
    });
  }

  const token = createToken({ userId: user._id, role: user.role });
  setAuthCookie(res, token);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Google authentication successful',
    token,
    user: {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
    },
  });
});

// ─── Logout ────────────────────────────────────────────────
export const logout = (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(StatusCodes.OK).json({ msg: 'Logged out successfully' });
};