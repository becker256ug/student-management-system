const express = require("express");

const {
  createClass,
  getClasses,
} = require("../controllers/classController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All class routes require authentication
router.use(authenticateToken);

// Only admin and registrar can create classes
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createClass
);

// Authenticated users can view classes
router.get("/", getClasses);

module.exports = router;