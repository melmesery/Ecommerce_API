import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/CloudinaryMulter.js";
import subcategoryRouter from "../subcategory/subcategory.router.js";
import * as validators from "./category.validation.js";
import * as categoryController from "./controller/category.js";
import { auth, roles } from "../../middleware/auth.js";
import { endPoint } from "./category.endPoint.js";
const router = Router();

router.use("/:categoryId/subcategory", subcategoryRouter);

router.get("/", auth(Object.values(roles)), categoryController.getCategory);

router.post(
  "/",
  auth(endPoint.create),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.createCategory),
  categoryController.createCategory
);

router.put(
  "/:categoryId",
  auth(),
  fileUpload(fileValidation.image).single("image"),
  validation(validators.updateCategory),
  categoryController.updateCategory
);

export default router;
