const express = require("express");

const {
  createSubject,
  getSubjects,
} = require("../controllers/subjectController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All subject routes require authentication
router.use(authenticateToken);

// Only admin and registrar can create subjects
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createSubject
);

// Authenticated users can view subjects
router.get("/", getSubjects);

module.exports = router;