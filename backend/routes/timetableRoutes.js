const express = require("express");

const {
  createTimetable,
  getTimetables,
} = require("../controllers/timetableController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createTimetable
);

router.get("/", getTimetables);

module.exports = router;