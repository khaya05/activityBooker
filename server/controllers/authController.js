import { asyncWrapper } from "../util/asyncWrapper";
import { comparePassword, hashedPassword } from "../util/passwordUtil";
import User from '../models/userModel.js'
import { StatusCodes } from "http-status-codes";
import { UnauthenticatedError } from "../errors/customErrors";
import { createToken } from "../util/tokenUtil.js";

export const register = asyncWrapper(async (req, res) => {
  const hashedPassword = await hashedPassword(req.body.password)
  req.body.password = hashedPassword;
  const user = await User.create(req.body)
  res.status(StatusCodes.CREATED).json({ user })
})

export const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email })

  const isValidUser = user && (await comparePassword(password, user.password))
  if (!isValidUser) throw new UnauthenticatedError('invalid credentials')

  const token = createToken({ userId: user._id, role: user.role })
  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === 'production'
  })

  res.status(StatusCodes.OK).json({ msg: 'user logged in' })
})

export const logout = (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now())
  })

  res.status(StatusCodes.OK).json({ msg: 'user logged out' })
}