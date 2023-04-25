import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const createOrder = joi.object({
  note: joi.string().min(1),
  where: joi
    .object({
      address: joi.string().min(1).required(),
      state: joi.string().required(),
      city: joi.string().required(),
      flat: joi.number().required(),
      postalCode: joi.number().required(),
    })
    .required(),
  phone: joi.array().items(generalFields.phone).min(1).max(3).required(),
  couponName: joi.string(),
  paymentType: joi.string().valid("cash", "card"),
  products: joi
    .array()
    .items(
      joi.object({
        productId: generalFields.id,
        quantity: joi.number().positive().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

export const cancelOrder = joi.object({
  orderId: generalFields.id,
  reason: joi.string().min(1).required(),
});

export const orderStatus = joi.object({
  orderId: generalFields.id,
  status: joi.string().valid("delivered", "onWay").required(),
});
