import { nanoid } from "nanoid";
import slugify from "slugify";
import brandModel from "../../../../DB/model/Brand.model.js";
import productModel from "../../../../DB/model/Product.model.js";
import subcategoryModel from "../../../../DB/model/Subcategory.model.js";
import userModel from "../../../../DB/model/User.model.js";
import cloudinary from "../../../utils/Cloudinary.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";
import ApiFeatures from "../../../utils/API_Features.js";

export const productList = asyncHandler(async (req, res, next) => {
  const apiFeature = new ApiFeatures(
    productModel.find().populate([
      {
        path: "reviews",
      },
    ]),
    req.query
  )
    .paginate()
    .filter()
    .sort()
    .search()
    .select();

  const products = await apiFeature.mongooseQuery;

  for (let i = 0; i < products.length; i++) {
    let calcRating = 0;
    for (let j = 0; j < products[i].reviews.length; j++) {
      calcRating += products[i].reviews[j].rating;
    }
    let avgRating = calcRating / products[i].reviews.length;
    const product = products[i].toObject();
    product.avgRating = avgRating;
    products[i] = product;
  }

  return res.status(200).json({ message: "Done", products });
});

export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, categoryId, subcategoryId, brandId, price, discount } =
    req.body;
  if (!(await subcategoryModel.findOne({ _id: subcategoryId, categoryId }))) {
    return next(
      new Error("In-valid Category || Subcategory ID", { cause: 400 })
    );
  }
  if (!(await brandModel.findOne({ _id: brandId }))) {
    return next(new Error("In-valid Brand ID", { cause: 400 }));
  }
  req.body.slug = slugify(name, {
    replacement: "-",
    trim: true,
    lower: true,
  });
  req.body.finalPrice = Number.parseFloat(
    price - price * ((discount || 0) / 100)
  ).toFixed(2);

  req.body.customId = nanoid();

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files.mainImage[0].path,
    { folder: `${process.env.APP_NAME}/product/${req.body.customId}` }
  );
  req.body.mainImage = { secure_url, public_id };

  if (req.files.subImages) {
    req.body.subImages = [];
    for (const file of req.files.subImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.APP_NAME}/product/${req.body.customId}/subImages`,
        }
      );
      req.body.subImages.push({ secure_url, public_id });
    }
  }

  req.body.createdBy = req.user._id;

  const product = await productModel.create(req.body);
  if (!product) {
    return next(new Error("Fail To Add Product", { cause: 400 }));
  }
  return res.status(201).json({ message: "Done", product });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("In-valid Product ID", { cause: 400 }));
  }
  const { name, categoryId, subcategoryId, brandId, price, discount } =
    req.body;
  if (categoryId && subcategoryId) {
    if (!(await subcategoryModel.findOne({ _id: subcategoryId, categoryId }))) {
      return next(
        new Error("In-valid Category || Subcategory ID", { cause: 400 })
      );
    }
  }
  if (brandId) {
    if (!(await brandModel.findOne({ _id: brandId }))) {
      return next(new Error("In-valid Brand ID", { cause: 400 }));
    }
  }
  if (name) {
    req.body.slug = slugify(name, {
      replacement: "-",
      trim: true,
      lower: true,
    });
  }

  if (price && discount) {
    req.body.finalPrice = Number.parseFloat(
      price - price * (discount / 100)
    ).toFixed(2);
  } else if (price) {
    req.body.finalPrice = Number.parseFloat(
      price - price * (product.discount / 100)
    ).toFixed(2);
  } else if (discount) {
    req.body.finalPrice = Number.parseFloat(
      product.price - product.price * (discount / 100)
    ).toFixed(2);
  }

  if (req.files?.mainImage?.length) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.mainImage[0].path,
      { folder: `${process.env.APP_NAME}/product/${product.customId}` }
    );
    await cloudinary.uploader.destroy(product.mainImage.publicId);
    req.body.mainImage = { secure_url, public_id };
  }

  if (req.files?.subImages?.length) {
    req.body.subImages = [];
    for (const file of req.files.subImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.APP_NAME}/product/${req.body.customId}/subImages`,
        }
      );
      req.body.subImages.push({ secure_url, public_id });
    }
  }

  req.body.updatedBy = req.user._id;
  await productModel.updateOne({ _id: product._id }, req.body);
  return res.status(200).json({ message: "Done" });
});

export const addToWishlist = asyncHandler(async (req, res, next) => {
  if (!(await productModel.findById(req.params.productId))) {
    return next(new Error("In-valid Product", { cause: 400 }));
  }
  const user = await userModel.updateOne(
    { _id: req.user._id },
    { $addToSet: { wishlist: req.params.productId } }
  );
  return res.status(200).json({ message: "Done", user });
});

export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  await userModel.updateOne(
    { _id: req.user._id },
    { $pull: { wishlist: req.params.productId } }
  );
  return res.status(200).json({ message: "Done" });
});
