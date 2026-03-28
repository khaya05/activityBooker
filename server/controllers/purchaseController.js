import { asyncWrapper } from '../util/asyncWrapper.js';
import Purchase, { PACKS } from '../models/purchaseModel.js';
import User from '../models/userModel.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/customErrors.js';
import crypto from 'crypto';


function generatePaymentReference() {
  return 'SIM-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

export const getPacks = asyncWrapper(async (req, res) => {
  const packs = Object.entries(PACKS).map(([id, pack]) => ({ id, ...pack }));
  res.status(StatusCodes.OK).json({ packs });
});

export const getPurchases = asyncWrapper(async (req, res) => {
  const purchases = await Purchase.find({ parent: req.user.userId }).sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ purchases, count: purchases.length });
});


export const createPurchase = asyncWrapper(async (req, res) => {
  const { pack: packKey } = req.body;

  const pack = PACKS[packKey];
  if (!pack) {
    throw new BadRequestError(
      `Invalid pack. Valid options are: ${Object.keys(PACKS).join(', ')}`
    );
  }

  if (packKey === 'trial') {
    const alreadyUsed = await Purchase.findOne({
      parent: req.user.userId,
      pack: 'trial',
      status: 'completed',
    });
    if (alreadyUsed) {
      throw new BadRequestError(
        'Trial lesson has already been purchased on this account'
      );
    }
  }

  const parent = await User.findByIdAndUpdate(
    req.user.userId,
    { $inc: { lessonBalance: pack.lessons } },
    { new: true }
  );
  if (!parent) throw new NotFoundError('User not found');

  const purchase = await Purchase.create({
    parent: req.user.userId,
    pack: packKey,
    packName: pack.name,
    lessonsAdded: pack.lessons,
    amountPaid: pack.price,
    paymentReference: generatePaymentReference(),
    balanceAfter: parent.lessonBalance,
  });

  res.status(StatusCodes.CREATED).json({
    purchase,
    newLessonBalance: parent.lessonBalance,
  });
});