import cartModel from "../../../../DB/model/Cart.model.js";
import productModel from "../../../../DB/model/Product.model.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";

export const createCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("In-valid Product ID", { cause: 400 }));
  }
  if (product.stock < quantity || product.isDeleted) {
    await productModel.updateOne(
      { _id: productId },
      { $addToSet: { wishUserList: req.user._id } }
    );
    return next(new Error("Exceeded Available Quantity", { cause: 400 }));
  }
  const cart = await cartModel.findOne({ userId: req.user._id });
  if (!cart) {
    const _cart = await cartModel.create({
      userId: req.user._id,
      products: [{ productId, quantity }],
    });
    return res.status(201).json({ message: "Done", cart: _cart });
  }

  let matchProduct = false;
  for (let i = 0; i < cart.products.length; i++) {
    if (cart.products[i].productId.toString() == productId) {
      cart.products[i].quantity = quantity;
      matchProduct = true;
      break;
    }
  }

  if (!matchProduct) {
    cart.products.push({ productId, quantity });
  }

  await cart.save();
  return res.status(200).json({ message: "Done", cart });
});

export async function deleteCartItems(productIds, userId) {
  const cart = await cartModel.updateOne(
    { userId },
    {
      $pull: {
        products: {
          productId: { $in: productIds },
        },
      },
    }
  );
  return cart;
}

export const deleteItems = asyncHandler(async (req, res, next) => {
  const { productIds } = req.body;
  await deleteCartItems(productIds, req.user._id);
  return res.status(200).json({ message: "Done" });
});

export async function emptyCart(userId) {
  const cart = await cartModel.updateOne(
    { userId },
    {
      products: [],
    }
  );
  return cart;
}

export const clearCart = asyncHandler(async (req, res, next) => {
  const { productIds } = req.body;
  await emptyCart(req.user._id);
  return res.status(200).json({ message: "Done" });
});
