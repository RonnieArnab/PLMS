import { body, validationResult } from "express-validator";

// ===== Signup Validator =====
export const validateSignup = [
  body("email").isEmail().withMessage("Invalid email address").normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain a number")
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain a special character"),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),

  body("aadhaar")
    .optional()
    .isLength({ min: 12, max: 12 })
    .withMessage("Aadhaar must be 12 digits")
    .isNumeric()
    .withMessage("Aadhaar must contain only numbers"),

  body("pan")
    .optional()
    .matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)
    .withMessage("Invalid PAN format"),

  // Middleware to handle errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// ===== Login Validator =====
export const validateLogin = [
  body("email").isEmail().withMessage("Invalid email").normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
