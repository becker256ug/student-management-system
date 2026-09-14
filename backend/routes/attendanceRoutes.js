const express = require("express");

const {
  createAttendance,
  getAttendance,
  getTeacherStudents,
  getTeacherAttendanceRecords,
} = require("../controllers/attendanceController");

const authenticateToken = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All attendance routes require authentication
|--------------------------------------------------------------------------
*/
router.use(authenticateToken);

/*
|--------------------------------------------------------------------------
| Teacher attendance students
|
| GET
| /api/attendance/teacher/students
|
| Query:
| class_subject_id
| semester_id
|--------------------------------------------------------------------------
*/
router.get(
  "/teacher/students",
  authorizeRoles("teacher"),
  getTeacherStudents
);

/*
|--------------------------------------------------------------------------
| Teacher attendance records
|
| GET
| /api/attendance/teacher/records
|
| Query:
| class_subject_id
| semester_id
| attendance_date
|--------------------------------------------------------------------------
*/
router.get(
  "/teacher/records",
  authorizeRoles("teacher"),
  getTeacherAttendanceRecords
);

/*
|--------------------------------------------------------------------------
| Create attendance
|
| POST
| /api/attendance
|
| Allowed:
| admin
| registrar
| teacher
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  authorizeRoles(
    "admin",
    "registrar",
    "teacher"
  ),
  createAttendance
);

/*
|--------------------------------------------------------------------------
| Get attendance
|
| GET
| /api/attendance
|
| Admin/Registrar:
|   all attendance
|
| Teacher:
|   only their assigned attendance
|--------------------------------------------------------------------------
*/
router.get(
  "/",
  getAttendance
);

module.exports = router;