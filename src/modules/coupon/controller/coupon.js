import slugify from "slugify";
import couponModel from "../../../../DB/model/Coupon.model.js";
import cloudinary from "../../../utils/Cloudinary.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";

export const getCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await couponModel.find();
  return res.status(200).json({ message: "Done", coupon });
});

export const createCoupon = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (await couponModel.findOne({ name })) {
    return next(new Error("Duplicate Coupon Name"), { cause: 409 });
  }
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `${process.env.APP_NAME}/coupon` }
    );
    req.body.image = { secure_url, public_id };
  }
  req.body.createdBy = req.user._id;
  req.body.exipreDate = new Date(req.body.exipreDate);
  const coupon = await couponModel.create(req.body);
  return res.status(201).json({ message: "Done" });
});

export const updateCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await couponModel.findById(req.params.couponId);
  if (!coupon) {
    return next(new Error("In-valid Coupon Id"), { cause: 400 });
  }
  if (req.body.name) {
    if (coupon.name == req.body.name) {
      return next(new Error("Can't Update Coupon With The Same Name"), {
        cause: 400,
      });
    }
    if (await couponModel.findOne({ name: req.body.name })) {
      return next(new Error("Duplicate Coupon Name"), { cause: 409 });
    }
    coupon.name = req.body.name;
  }
  if (req.body.amount) {
    coupon.amount = req.body.amount;
  }
  if (req.body.exipreDate) {
    coupon.exipreDate = new Date(req.body.exipreDate);
  }
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `${process.env.APP_NAME}/coupon` }
    );
    await cloudinary.uploader.destroy(coupon.image.public_id);
    coupon.image = { secure_url, public_id };
  }
  coupon.updatedBy = req.user._id;
  await coupon.save();
  return res.status(200).json({ message: "Done" });
});
