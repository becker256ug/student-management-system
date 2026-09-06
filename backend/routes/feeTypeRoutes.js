const express = require("express");

const {
  createFeeType,
  getFeeTypes,
} = require("../controllers/feeTypeController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createFeeType
);

router.get("/", getFeeTypes);

module.exports = router;