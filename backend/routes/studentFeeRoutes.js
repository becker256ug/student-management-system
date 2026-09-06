const express = require("express");

const {
  createStudentFee,
  getStudentFees,
} = require("../controllers/studentFeeController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createStudentFee
);

router.get("/", getStudentFees);

module.exports = router;