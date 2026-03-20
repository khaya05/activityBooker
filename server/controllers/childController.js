import { asyncWrapper } from '../util/asyncWrapper.js';
import Child from '../models/childModel.js';
import User from '../models/userModel.js';
import { StatusCodes } from 'http-status-codes';

export const getChildren = asyncWrapper(async (req, res) => {
  const children = await Child.find({ parent: req.user.userId }).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ children, count: children.length });
});

export const getChild = asyncWrapper(async (req, res) => {
  res.status(StatusCodes.OK).json({ child: req.child });
});

export const createChild = asyncWrapper(async (req, res) => {
  const { consentStatus: _cs, parent: _p, ...childData } = req.body;

  const child = await Child.create({
    ...childData,
    parent: req.user.userId,
    consentStatus: 'pending',
  });

  await User.findByIdAndUpdate(req.user.userId, { $push: { children: child._id } });

  res.status(StatusCodes.CREATED).json({ child });
});

export const updateChild = asyncWrapper(async (req, res) => {
  const { consentStatus: _cs, parent: _p, ...updates } = req.body;

  const child = await Child.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ child });
});

export const deleteChild = asyncWrapper(async (req, res) => {
  await Child.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(req.user.userId, { $pull: { children: req.params.id } });

  res.status(StatusCodes.OK).json({ msg: 'Child profile deleted' });
});