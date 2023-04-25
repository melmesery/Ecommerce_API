import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/CloudinaryMulter.js";
import * as validators from "./coupon.validation.js";
import * as couponController from "./controller/coupon.js";
import { auth } from "../../middleware/auth.js";
import { endPoint } from "./coupon.endPoint.js";
const router = Router();

router.get("/", couponController.getCoupon);

router.post(
  "/",
  auth(endPoint.create),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.createCoupon),
  couponController.createCoupon
);

router.put(
  "/:couponId",
  auth(endPoint.update),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.updateCoupon),
  couponController.updateCoupon
);

export default router;
