import { asyncWrapper } from "../util/asyncWrapper.js";
import User from '../models/userModel.js'
import { StatusCodes } from "http-status-codes";

export const getCurrentUser = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user.userId)
  const { password: _pw, ...safeUser } = user.toObject();

  res.status(StatusCodes.OK).json({ user: safeUser });
})