import dayjs from 'dayjs';
import { asyncWrapper } from '../util/asyncWrapper.js';
import Booking from '../models/bookingModel.js';
import Class from '../models/classModel.js';
import User from '../models/userModel.js';
import Child from '../models/childModel.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError, Unauthorized } from '../errors/customErrors.js';

const CANCELLATION_HOURS = 24; 
const LESSON_COST = 1;        

const DAY_MAP = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function resolveClassDate(cls, dateStr) {
  const requested = dayjs(dateStr).startOf('day');
  const expectedDow = DAY_MAP[cls.dayOfWeek];

  if (requested.day() !== expectedDow) {
    throw new BadRequestError(
      `Class "${cls.name}" runs on ${cls.dayOfWeek}s. The date ${dateStr} is a ${requested.format('dddd')}.`
    );
  }

  const [hours, minutes] = cls.startTime.split(':').map(Number);
  const classDateTime = requested.hour(hours).minute(minutes).second(0).millisecond(0);

  if (classDateTime.isBefore(dayjs())) {
    throw new BadRequestError('Cannot book a class that has already started or passed.');
  }

  return classDateTime.toDate();
}

async function getEnrolledCount(classId, classDate) {
  return Booking.countDocuments({
    class: classId,
    classDate,
    status: 'confirmed',
  });
}

export const getBookings = asyncWrapper(async (req, res) => {
  const filter = { parent: req.user.userId };

  if (req.query.childId) filter.child = req.query.childId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.upcoming === 'true') filter.classDate = { $gte: new Date() };

  const bookings = await Booking.find(filter)
    .populate('child', 'name lastName')
    .populate({
      path: 'class',
      select: 'name dayOfWeek startTime duration instructor icon',
      populate: { path: 'instructor', select: 'name lastName' },
    })
    .sort({ classDate: 1 });

  res.status(StatusCodes.OK).json({ bookings, count: bookings.length });
});

export const getBooking = asyncWrapper(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('child', 'name lastName')
    .populate({
      path: 'class',
      select: 'name dayOfWeek startTime duration instructor icon',
      populate: { path: 'instructor', select: 'name lastName' },
    });

  if (!booking) throw new NotFoundError('Booking not found');
  if (!booking.parent.equals(req.user.userId)) {
    throw new Unauthorized('You do not have permission to view this booking');
  }

  res.status(StatusCodes.OK).json({ booking });
});

export const createBooking = asyncWrapper(async (req, res) => {
  const { childId, classId, classDate: classDateStr } = req.body;

  // 1. Verify child ownership
  const child = await Child.findById(childId);
  if (!child) throw new NotFoundError('Child not found');
  if (!child.parent.equals(req.user.userId)) {
    throw new Unauthorized('You do not have permission to book for this child');
  }

  // 2. Verify class
  const cls = await Class.findById(classId);
  if (!cls) throw new NotFoundError('Class not found');
  if (!cls.isActive) throw new BadRequestError('This class is no longer active');

  // 3 & 4. Resolve and validate the class date/time
  const classDate = resolveClassDate(cls, classDateStr);

  // 5. Check capacity
  const enrolled = await getEnrolledCount(classId, classDate);
  if (enrolled >= cls.capacity) {
    throw new BadRequestError('This class is fully booked for the selected date');
  }

  // 6. Check duplicate booking
  const existing = await Booking.findOne({
    child: childId,
    class: classId,
    classDate,
    status: 'confirmed',
  });
  if (existing) {
    throw new BadRequestError('This child is already booked for this class on that date');
  }

  // 7. Check and decrement balance atomically
  const parent = await User.findOneAndUpdate(
    { _id: req.user.userId, lessonBalance: { $gte: LESSON_COST } },
    { $inc: { lessonBalance: -LESSON_COST } },
    { new: true }
  );

  if (!parent) {
    throw new BadRequestError(
      'Insufficient lesson balance. Please top up before booking.'
    );
  }

  // Create the booking
  const booking = await Booking.create({
    parent: req.user.userId,
    child: childId,
    class: classId,
    classDate,
    lessonCost: LESSON_COST,
  });

  const populated = await booking.populate([
    { path: 'child', select: 'name lastName' },
    {
      path: 'class',
      select: 'name dayOfWeek startTime duration instructor icon',
      populate: { path: 'instructor', select: 'name lastName' },
    },
  ]);

  res.status(StatusCodes.CREATED).json({
    booking: populated,
    newLessonBalance: parent.lessonBalance,
  });
});

export const cancelBooking = asyncWrapper(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('class');

  if (!booking) throw new NotFoundError('Booking not found');
  if (!booking.parent.equals(req.user.userId)) {
    throw new Unauthorized('You do not have permission to cancel this booking');
  }
  if (booking.status === 'cancelled') {
    throw new BadRequestError('This booking is already cancelled');
  }

  const now = dayjs();
  const classStart = dayjs(booking.classDate);
  const hoursUntilClass = classStart.diff(now, 'hour');
  const eligibleForRefund = hoursUntilClass >= CANCELLATION_HOURS;

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  let newLessonBalance = null;

  if (eligibleForRefund) {
    const parent = await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { lessonBalance: booking.lessonCost } },
      { new: true }
    );
    newLessonBalance = parent.lessonBalance;
  }

  res.status(StatusCodes.OK).json({
    msg: eligibleForRefund
      ? `Booking cancelled and ${booking.lessonCost} lesson(s) refunded.`
      : `Booking cancelled. No refund — cancellations must be made at least ${CANCELLATION_HOURS} hours before the class.`,
    refunded: eligibleForRefund,
    newLessonBalance,
  });
});

export const getClassAvailability = asyncWrapper(async (req, res) => {
  const { classId, weekStart } = req.query;

  const cls = await Class.findById(classId).populate('instructor', 'name lastName');
  if (!cls) throw new NotFoundError('Class not found');
  if (!cls.isActive) throw new BadRequestError('Class is not active');

  const startDate = weekStart ? dayjs(weekStart).startOf('day') : dayjs().startOf('day');
  const expectedDow = DAY_MAP[cls.dayOfWeek];

  let cursor = startDate.clone();
  while (cursor.day() !== expectedDow) {
    cursor = cursor.add(1, 'day');
  }

  const parent = await User.findById(req.user.userId).select('children lessonBalance');
  const childIds = parent.children;

  const slots = [];
  for (let i = 0; i < 4; i++) {
    const [hours, minutes] = cls.startTime.split(':').map(Number);
    const classDateTime = cursor.hour(hours).minute(minutes).second(0).millisecond(0).toDate();

    const enrolled = await getEnrolledCount(classId, classDateTime);

    const childBookings = await Booking.find({
      class: classId,
      classDate: classDateTime,
      status: 'confirmed',
      child: { $in: childIds },
    }).select('child');

    slots.push({
      classDate: classDateTime,
      enrolled,
      spotsLeft: Math.max(cls.capacity - enrolled, 0),
      isFull: enrolled >= cls.capacity,
      bookedChildren: childBookings.map((b) => b.child),
    });

    cursor = cursor.add(7, 'day');
  }

  res.status(StatusCodes.OK).json({
    class: cls,
    lessonBalance: parent.lessonBalance,
    slots,
  });
});