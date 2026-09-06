const express = require("express");

const {
  createEnrollment,
  getEnrollments,
} = require("../controllers/enrollmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createEnrollment
);

router.get("/", getEnrollments);

module.exports = router;