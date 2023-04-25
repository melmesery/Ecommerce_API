import { customAlphabet, nanoid } from "nanoid";
import userModel from "../../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/ErrorHandling.js";
import {
  generateToken,
  verifyToken,
} from "../../../utils/GenerateAndVerifyToken.js";
import { compare, hash } from "../../../utils/HashAndCompare.js";
import sendEmail from "../../../utils/SendEmail.js";

export const signUp = asyncHandler(async (req, res, next) => {
  const { userName, email, password } = req.body;
  const User = await userModel.findOne({ email: email.toLowerCase() });
  if (User) {
    return next(new Error("Email Exists", { cause: 409 }));
  }
  const token = generateToken({
    payload: { email },
    signature: process.env.EMAIL_TOKEN_SIGNATURE,
    expiresIn: 60 * 5,
  });
  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}`;
  const refreshToken = generateToken({
    payload: { email },
    signature: process.env.EMAIL_TOKEN_SIGNATURE,
    expiresIn: 60 * 60 * 24 * 30,
  });
  const refreshLink = `${req.protocol}://${req.headers.host}/auth/newConfirmEmail/${refreshToken}`;
  const html = `<a href="${link}">Click Here To Confirm Email</a> 
  <br/> 
  <br/> 
  <a href="${refreshLink}">Request New Email</a>`;
  if (!(await sendEmail({ to: email, subject: "Confirm Email", html }))) {
    return next(new Error("Rejected Email", { cause: 400 }));
  }
  const hashPassword = hash({ plainText: password });
  const createUser = await userModel.create({
    userName,
    email,
    password: hashPassword,
  });
  return res.status(201).json({ message: "Done" });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { email } = verifyToken({
    token,
    signature: process.env.EMAIL_TOKEN_SIGNATURE,
  });
  const User = await userModel.updateOne(
    { email: email.toLowerCase() },
    { confirmEmail: true }
  );
  return User.modifiedCount
    ? res.status(200).redirect("https://www.facebook.com")
    : res.status(404).send("Account Not Registered");
});

export const newConfirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { email } = verifyToken({
    token,
    signature: process.env.EMAIL_TOKEN_SIGNATURE,
  });
  const newToken = generateToken({
    payload: { email },
    signature: process.env.EMAIL_TOKEN_SIGNATURE,
    expiresIn: 60 * 2,
  });
  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${newToken}`;
  const refreshLink = `${req.protocol}://${req.headers.host}/auth/newConfirmEmail/${token}`;
  const html = `<a href="${link}">Click Here To Confirm Email</a> 
  <br/> 
  <br/> 
  <a href="${refreshLink}">Request New Email</a>`;
  if (!(await sendEmail({ to: email, subject: "Confirm Email", html }))) {
    return next(new Error("Rejected Email", { cause: 400 }));
  }
  return res.status(200).send("Please, Check Your Email");
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const User = await userModel.findOne({ email: email.toLowerCase() });
  if (!User) {
    return next(new Error("Email Not Exist", { cause: 404 }));
  }
  if (!User.confirmEmail) {
    return next(new Error("Please! Confirm Your Email", { cause: 400 }));
  }
  const match = compare({ plainText: password, hashValue: User.password });
  if (!match) {
    return next(new Error("In-valid Password", { cause: 400 }));
  }
  const access_token = generateToken({
    payload: { id: User._id, isLoggedIn: true, role: User.role },
    expiresIn: 60 * 30,
  });
  const refresh_token = generateToken({
    payload: { id: User._id, isLoggedIn: true, role: User.role },
    expiresIn: 60 * 60 * 24 * 365,
  });
  User.userStatus = "online";
  await User.save();
  return res.status(200).json({ message: "Done", access_token, refresh_token });
});

export const sendCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const nanoId = customAlphabet("123456789", 4);
  const forgetCode = nanoId();
  const user = await userModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    { forgetCode },
    { new: true }
  );
  if (!user) {
    return next(new Error("Not Registered Account", { cause: 404 }));
  }
  const html = `<p>${forgetCode}</p>`;
  if (!(await sendEmail({ to: email, subject: "Your Code", html }))) {
    return next(new Error("Rejected Email", { cause: 400 }));
  }
  return res.status(200).json({ message: "Done" });
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { forgetCode, password } = req.body;
  const user = await userModel.findOne({ forgetCode });
  if (!user || !user.forgetCode) {
    return next(new Error("In-valid Code", { cause: 404 }));
  }
  const hashPassword = hash({ plainText: password });
  user.password = hashPassword;
  user.forgetCode = null;
  user.changePasswordTime = Date.now();
  await user.save();
  return res.status(200).json({ message: "Done" });
});
