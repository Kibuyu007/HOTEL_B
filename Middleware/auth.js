import { verifyToken } from "../Utils/jwt.js";
import User from "../Models/Management/Users/user.js";
import AppError from "../Utils/AppError.js";
import catchAsync from "../Utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token from headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401),
    );
  }

  // 2) Verify token using your MYCODE secret
  const decoded = verifyToken(token);

  // 3) Check if user still exists
  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401),
    );
  }

  // 4) Check if user is active
  if (user.isActive === false || user.isDeleted === true) {
    return next(
      new AppError("Your account is deactivated. Please contact support.", 403),
    );
  }

  // 5) Grant access - attach user to request
  req.user = user;
  next();
});

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("You are not logged in.", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }
    next();
  };
};
