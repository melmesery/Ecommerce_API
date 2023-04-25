import orderModel from "../../../../DB/model/Order.model.js";
import reviewModel from "../../../../DB/model/Review.model.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";

export const createReview = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { comment, rating } = req.body;

  const order = await orderModel.findOne({
    userId: req.user._id,
    status: "delivered",
    "products.productId": productId,
  });

  if (!order) {
    return next(new Error(`Can't Review Order Before Receive`, { cause: 400 }));
  }

  const checkReview = await reviewModel.findOne({
    createdBy: req.user._id,
    orderId: order._id,
    productId,
  });

  if (checkReview) {
    return next(new Error(`Already Reviewed Before`, { cause: 400 }));
  }

  const review = await reviewModel.create({
    comment,
    rating,
    createdBy: req.user._id,
    orderId: order._id,
    productId,
  });

  return res.status(201).json({ message: "Done" });
});

export const updateReview = asyncHandler(async (req, res, next) => {
  const { productId, reviewId } = req.params;

  const review = await reviewModel.updateOne(
    {
      _id: reviewId,
      productId,
    },
    req.body
  );

  if (!review.modifiedCount) {
    return next(new Error(`Check Your IDs`, { cause: 400 }));
  }

  return res.status(200).json({ message: "Done" });
});
