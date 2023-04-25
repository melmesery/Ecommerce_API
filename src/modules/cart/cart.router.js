import { Router } from "express";
import * as cartController from "./controller/cart.js";
import { auth } from "../../middleware/auth.js";
import { endPoint } from "./cart.endPoint.js";
const router = Router();

router.post("/", auth(endPoint.create), cartController.createCart);

router.patch("/remove", auth(endPoint.remove), cartController.deleteItems);

router.patch("/clear", auth(endPoint.clear), cartController.clearCart);

export default router;
