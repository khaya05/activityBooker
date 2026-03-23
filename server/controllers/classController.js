import { asyncWrapper } from '../util/asyncWrapper.js';
import Class from '../models/classModel.js';
import { StatusCodes } from 'http-status-codes';

export const getClasses = asyncWrapper(async (req, res) => {
  const classes = await Class.find({ isActive: true })
    .populate('instructor', 'name lastName')
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.status(StatusCodes.OK).json({ classes, count: classes.length });
});

export const getClass = asyncWrapper(async (req, res) => {
  res.status(StatusCodes.OK).json({ class: req.cls });
});


// admin only
export const createClass = asyncWrapper(async (req, res) => {
  const cls = await Class.create(req.body);
  const populated = await cls.populate('instructor', 'name lastName');

  res.status(StatusCodes.CREATED).json({ class: populated });
});

export const updateClass = asyncWrapper(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('instructor', 'name lastName');

  res.status(StatusCodes.OK).json({ class: cls });
});

export const deleteClass = asyncWrapper(async (req, res) => {
  await Class.findByIdAndUpdate(req.params.id, { isActive: false });
  res.status(StatusCodes.OK).json({ msg: 'Class deactivated' });
});