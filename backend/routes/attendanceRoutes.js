const express = require("express");

const {
  createAttendance,
  getAttendance,
} = require("../controllers/attendanceController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createAttendance
);

router.get("/", getAttendance);

module.exports = router;