const express = require("express");

const {
  createAcademicYear,
  getAcademicYears,
} = require("../controllers/academicYearController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createAcademicYear
);

router.get("/", getAcademicYears);

module.exports = router;