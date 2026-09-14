const express = require("express");

const {
  getMyProfile,
  getMyAttendance,
  getMyTimetable,
  getMyFees,
} = require("../controllers/studentPortalController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

router.use(authenticateToken);

/*
|--------------------------------------------------------------------------
| STUDENT-ONLY ACCESS
|--------------------------------------------------------------------------
*/

router.use(authorizeRoles("student"));

/*
|--------------------------------------------------------------------------
| MY PROFILE
|--------------------------------------------------------------------------
| GET /api/student-portal/profile
|--------------------------------------------------------------------------
*/

router.get(
  "/profile",
  getMyProfile
);

/*
|--------------------------------------------------------------------------
| MY ATTENDANCE
|--------------------------------------------------------------------------
| GET /api/student-portal/attendance
|--------------------------------------------------------------------------
*/

router.get(
  "/attendance",
  getMyAttendance
);

/*
|--------------------------------------------------------------------------
| MY TIMETABLE
|--------------------------------------------------------------------------
| GET /api/student-portal/timetable
|--------------------------------------------------------------------------
*/

router.get(
  "/timetable",
  getMyTimetable
);

/*
|--------------------------------------------------------------------------
| MY FEES
|--------------------------------------------------------------------------
| GET /api/student-portal/fees
|--------------------------------------------------------------------------
*/

router.get(
  "/fees",
  getMyFees
);

module.exports = router;