import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const createCoupon = joi
  .object({
    name: joi.string().min(2).max(25).required(),
    amount: joi.number().positive().min(1).max(100).required(),
    expireDate: joi.date().greater(Date.now()).required(),
    file: generalFields.file,
  })
  .required();

export const updateCoupon = joi
  .object({
    couponId: generalFields.id,
    amount: joi.number().positive().min(1).max(100).required(),
    expireDate: joi.date().greater(Date.now()).required(),
    name: joi.string().min(2).max(25),
    file: generalFields.file,
  })
  .required();
