const express = require("express");

const {
  getActivityLogs,
} = require("../controllers/activityLogController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
 * All activity-log routes require authentication.
 */
router.use(authenticateToken);

/*
 * Activity logs are accessible to ADMIN only.
 */
router.get(
  "/",
  authorizeRoles("admin"),
  getActivityLogs
);

module.exports = router;