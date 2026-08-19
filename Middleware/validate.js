// Middleware/validate.js
import { validationResult } from "express-validator";
import AppError from "../Utils/AppError.js";

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    // Pass to error handler with 400 status
    const error = new AppError(extractedErrors[0].message, 400);
    error.errors = extractedErrors; // Attach all errors for field-specific display
    return next(error);
  };
};
