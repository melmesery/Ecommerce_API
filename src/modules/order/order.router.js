import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import * as orderController from "./controller/order.js";
import { endPoint } from "./order.endPoint.js";
import * as validators from "./order.validation.js";

const router = Router();

router.post(
  "/",
  auth(endPoint.create),
  validation(validators.createOrder),
  orderController.createOrder
);

router.patch(
  "/:orderId/cancel",
  auth(endPoint.cancel),
  validation(validators.cancelOrder),
  orderController.cancelOrder
);

router.patch(
  "/:orderId",
  auth(endPoint.status),
  validation(validators.orderStatus),
  orderController.orderStatus
);

export default router;
