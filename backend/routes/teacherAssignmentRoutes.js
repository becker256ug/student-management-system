const express = require("express");

const {
  createTeacherAssignment,
  getTeacherAssignments,
} = require("../controllers/teacherAssignmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createTeacherAssignment
);

router.get("/", getTeacherAssignments);

module.exports = router;