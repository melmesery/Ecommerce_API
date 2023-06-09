import connectDB from "../DB/connection.js";
import authRouter from "./modules/auth/auth.router.js";
import branRouter from "./modules/brand/brand.router.js";
import cartRouter from "./modules/cart/cart.router.js";
import categoryRouter from "./modules/category/category.router.js";
import couponRouter from "./modules/coupon/coupon.router.js";
import orderRouter from "./modules/order/order.router.js";
import productRouter from "./modules/product/product.router.js";
import reviewsRouter from "./modules/reviews/reviews.router.js";
import subcategoryRouter from "./modules/subcategory/subcategory.router.js";
import userRouter from "./modules/user/user.router.js";
import { globalErrHandling } from "./utils/ErrorHandling.js";

const initApp = (app, express) => {
  app.use((req, res, next) => {
    if (req.originalUrl == "/order/webhook") {
      next();
    } else {
      express.json({})(req, res, next);
    }
  });

  // var whitelist = [];
  // app.use(async (req, res, next) => {
  //   if (!whitelist.includes(req.header("origin"))) {
  //     return next(new Error("Not Allowed By CORS", { cause: 403 }));
  //   }
  //   await res.header("Access-Control-Allow-Origin", "*");
  //   await res.header("Access-Control-Allow-Headers", "*");
  //   await res.header("Access-Control-Allow-Private-Network", "true");
  //   await res.header("Access-Control-Allow-Methods", "*");
  //   next();
  // });

  app.get("/", (req, res) => res.send("Hello World!"));
  app.use(`/auth`, authRouter);
  app.use(`/user`, userRouter);
  app.use(`/product`, productRouter);
  app.use(`/category`, categoryRouter);
  app.use(`/subCategory`, subcategoryRouter);
  app.use(`/review`, reviewsRouter);
  app.use(`/coupon`, couponRouter);
  app.use(`/cart`, cartRouter);
  app.use(`/order`, orderRouter);
  app.use(`/brand`, branRouter);

  app.all("*", (req, res, next) => {
    res.send("In-valid Routing Plz check url or method");
  });

  app.use(globalErrHandling);
  connectDB();
};

export default initApp;
