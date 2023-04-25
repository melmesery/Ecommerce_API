import { nanoid } from "nanoid";
import slugify from "slugify";
import categoryModel from "../../../../DB/model/Category.model.js";
import subcategoryModel from "../../../../DB/model/Subcategory.model.js";
import cloudinary from "../../../utils/Cloudinary.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";

export const getSubcategory = asyncHandler(async (req, res, next) => {
  const subcategory = await subcategoryModel.find();
  return res.status(200).json({ message: "Done", subcategory });
});

export const createSubcategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const { name } = req.body;
  if (!(await categoryModel.findById(categoryId))) {
    return next(new Error("In-valid Category Id"), { cause: 400 });
  }
  if (await subcategoryModel.findOne({ name })) {
    return next(new Error("Duplicate subcategory Name"), { cause: 409 });
  }
  const customId = nanoid();
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `${process.env.APP_NAME}/category/${categoryId}/${customId}` }
  );
  const subcategory = await subcategoryModel.create({
    name,
    slug: slugify(name, "_"),
    image: { secure_url, public_id },
    categoryId,
    customId,
    createdBy: req.user._id,
  });
  return res.status(201).json({ message: "Done" });
});

export const updateSubcategory = asyncHandler(async (req, res, next) => {
  const { categoryId, subcategoryId } = req.params;
  const { name } = req.body;
  const subcategory = await subcategoryModel.findOne({
    _id: subcategoryId,
    categoryId,
  });
  if (!subcategory) {
    return next(new Error("In-valid subcategory Id"), { cause: 400 });
  }
  if (name) {
    if (subcategory.name == name) {
      return next(new Error("Can't Update Subcategory With The Same Name"), {
        cause: 400,
      });
    }
    if (await subcategoryModel.findOne({ name })) {
      return next(new Error("Duplicate Subcategory Name"), { cause: 409 });
    }
    subcategory.name = name;
    subcategory.slug = slugify(name, "-");
  }
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `${process.env.APP_NAME}/category/${categoryId}/${customId}` }
    );
    await cloudinary.uploader.destroy(subcategory.image.public_id);
    subcategory.image = { secure_url, public_id };
  }
  subcategory.updatedBy = req.user._id;
  await subcategory.save();
  return res.status(200).json({ message: "Done" });
});
