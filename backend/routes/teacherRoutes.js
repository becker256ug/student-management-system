const express = require("express");

const {
  createTeacher,
  getTeachers,
} = require("../controllers/teacherController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All teacher routes require authentication
router.use(authenticateToken);

// Only admin and registrar can register teachers
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createTeacher
);

// Authenticated users can view teachers for now
router.get("/", getTeachers);

module.exports = router;