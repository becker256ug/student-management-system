const express = require("express");

const {
  createPayment,
  getPayments,
} = require("../controllers/paymentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createPayment
);

router.get("/", getPayments);

module.exports = router;