import cartModel from "../../../../DB/model/Cart.model.js";
import couponModel from "../../../../DB/model/Coupon.model.js";
import orderModel from "../../../../DB/model/Order.model.js";
import productModel from "../../../../DB/model/Product.model.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";
import { createInvoice } from "../../../utils/PDF.js";
import payment from "../../../utils/Payment.js";
import sendEmail from "../../../utils/SendEmail.js";
import { deleteCartItems } from "../../cart/controller/cart.js";


export const createOrder = asyncHandler(async (req, res, next) => {
  const { products, where, phone, note, couponName, paymentType } = req.body;

  if (!req.body.products) {
    const cart = await cartModel.findOne({ userId: req.user._id });
    if (!cart?.products?.length) {
      return next(new Error("Empty Cart", { cause: 400 }));
    }
    req.body.isCart = true;
    req.body.products = cart.products;
  }

  if (couponName) {
    const coupon = await couponModel.findOne({
      name: couponName,
      usedBy: { $nin: req.user._id },
    });
    if (!coupon || coupon.expireDate.getTime() < Date.now()) {
      return next(new Error("In-valid || Expired Coupon", { cause: 404 }));
    }
    req.body.coupon = coupon;
  }

  const finalProductList = [];
  const productIds = [];
  let subtotal = 0;

  for (let product of req.body.products) {
    const checkedProduct = await productModel.findOne({
      _id: product.productId,
      stock: { $gte: product.quantity },
      isDeleted: false,
    });

    if (!checkedProduct) {
      return next(new Error("In-valid Product", { cause: 400 }));
    }

    if (req.body.isCart) {
      product = product.toObject();
    }

    productIds.push(product.productId);
    product.name = checkedProduct.name;
    product.unitPrice = checkedProduct.finalPrice;
    product.finalPrice =
      product.quantity * checkedProduct.finalPrice.toFixed(2);
    finalProductList.push(product);
    subtotal += product.finalPrice;
  }

  const order = await orderModel.create({
    userId: req.user._id,
    where,
    phone,
    note,
    products: finalProductList,
    couponId: req.body.coupon?._id,
    subtotal,
    finalPrice: (
      subtotal -
      (subtotal * (req.body.coupon?.amount || 0)) / 100
    ).toFixed(2),
    paymentType,
    status: paymentType == "card" ? "waitPayment" : "placed",
  });

  for (const product of req.body.products) {
    await productModel.updateOne(
      { _id: product.productId },
      { $inc: { stock: -parseInt(product.quantity) } }
    );
  }

  if (req.body.coupon) {
    await couponModel.updateOne(
      { _id: req.body.coupon._id },
      { $addToSet: { usedBy: req.user._id } }
    );
  }

  if (req.body.isCart) {
    await emptyCart(req.user._id);
  } else {
    await deleteCartItems(productIds, req.user._id);
  }

  const invoice = {
    shipping: {
      name: req.user.userName,
      address: where.address,
      city: where.city,
      state: where.state,
      country: "Egypt",
      postal_code: where.postalCode,
    },
    items: order.products,
    subtotal,
    total: order.finalPrice,
    invoice_nr: order._id,
    date: order.createdAt,
  };

  await createInvoice(invoice, "invoice.pdf");

  await sendEmail({
    to: req.user.email,
    subject: "Invoice",
    attachments: {
      path: "invoice.pdf",
      contentType: "application/pdf",
    },
  });

  if (order.paymentType == "card") {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    if (req.body.coupon) {
      const coupon = await stripe.coupons.create({
        percent_off: req.body.coupon.amount,
        duration: "once",
      });
      req.body.couponId = coupon.id;
    }
    const session = await payment({
      stripe,
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      metadata: {
        orderId: order._id.toString(),
      },
      cancel_url: `${process.env.CANCEL_URL}/${order._id}/cancel`,
      line_items: order.products.map((product) => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
            },
            unit_amount: product.unitPrice * 100,
          },
          quantity: product.quantity,
        };
      }),
      discounts: req.body.couponId ? [{ coupon: req.body.couponId }] : [],
    });

    return res
      .status(201)
      .json({ message: "Done", order, session, url: session.url });
  }
  return res.status(201).json({ message: "Done", order });
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await orderModel.findOne({
    _id: orderId,
    userId: req.user._id,
  });

  if (!order) {
    return next(new Error("In-valid Order ID", { cause: 404 }));
  }

  if (
    (order.status != "placed" && order.paymentType == "cash") ||
    (order.status != "waitPayment" && order.paymentType == "card")
  ) {
    return next(new Error("Order Can't Be Canceled", { cause: 400 }));
  }

  const cancelOrder = await orderModel.updateOne(
    { _id: orderId },
    { status: "canceled", reason, updatedBy: req.user._id }
  );

  if (!cancelOrder.matchedCount) {
    return next(new Error("Fail To Cancel Order", { cause: 400 }));
  }

  for (const product of order.products) {
    await productModel.updateOne(
      { _id: product.productId },
      { $inc: { stock: parseInt(product.quantity) } }
    );
  }

  if (order.couponId) {
    await couponModel.updateOne(
      { _id: order.couponId },
      { $pull: { usedBy: req.user._id } }
    );
  }

  return res.status(200).json({ message: "Done" });
});

export const orderStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await orderModel.find({ _id: orderId });

  if (!order) {
    return next(new Error("In-valid Order ID", { cause: 400 }));
  }

  const orderStatus = await orderModel.updateOne(
    { id: order._id },
    { status, updatedBy: req.user._id }
  );

  if (!orderStatus.matchedCount) {
    return next(new Error("In-valid Order ID", { cause: 400 }));
  }

  return res.status(200).json({ message: "Done" });
});

export const webhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  const stripe = new Stripe(process.env.STRIPE_KEY);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.END_POINT_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  } 

  const { orderId } = event.data.object.metadata;
  if (event.type != "checkout.session.completed") {
    await orderModel.updateOne({ id: orderId }, { status: "rejected" });
    return res.status(400).json({ message: "Payment Rejected" });
  }
  await orderModel.updateOne({ id: orderId }, { status: "placed" });
  return res.status(200).json({ message: "Done" });
});