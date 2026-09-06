const express = require("express");

const {
  createSemester,
  getSemesters,
} = require("../controllers/semesterController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createSemester
);

router.get("/", getSemesters);

module.exports = router;