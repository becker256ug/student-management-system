const express = require("express");
const rateLimit = require("express-rate-limit");

const { login } = require("../controllers/authController");

const router = express.Router();

/*
 * Login rate limiter
 * Protects the login endpoint from brute-force attacks.
 *
 * 10 login attempts per 15 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      "Too many login attempts from this IP. Please try again after 15 minutes.",
  },
});

router.post("/login", loginLimiter, login);

module.exports = router;