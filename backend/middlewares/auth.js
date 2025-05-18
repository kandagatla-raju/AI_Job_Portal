import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 400));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);

  next();
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    console.log("User Info:", req.user); // Debugging log

    if (!req.user) {
      return next(new ErrorHandler("User not authenticated!", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Access denied! Required roles: ${roles.join(", ")}, but found: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};


