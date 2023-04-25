import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import * as reviewController from "./controller/reviews.js";
import * as validators from "./reviews.validation.js";
import { endPoint } from "../reviews/reviews.endPoint.js";
const router = Router({ mergeParams: true });

router.post(
  "/",
  auth(endPoint.create),
  validation(validators.createReview),
  reviewController.createReview
);

router.patch(
  "/:reviewId",
  auth(endPoint.update),
  validation(validators.updateReview),
  reviewController.updateReview
);

export default router;
