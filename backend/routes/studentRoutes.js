const express = require("express");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
} = require("../controllers/studentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| All student routes require a valid login token.
|--------------------------------------------------------------------------
*/
router.use(authenticateToken);

/*
|--------------------------------------------------------------------------
| CREATE STUDENT
|--------------------------------------------------------------------------
| Admin and registrar can register students.
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createStudent
);

/*
|--------------------------------------------------------------------------
| GET ALL STUDENTS
|--------------------------------------------------------------------------
| Admin/registrar:
|   Can view all students.
|
| Student:
|   Controller restricts the result to the logged-in student.
|--------------------------------------------------------------------------
*/
router.get(
  "/",
  authorizeRoles("admin", "registrar", "student"),
  getStudents
);

/*
|--------------------------------------------------------------------------
| GET SINGLE STUDENT
|--------------------------------------------------------------------------
*/
router.get(
  "/:id",
  authorizeRoles("admin", "registrar", "student"),
  getStudentById
);

/*
|--------------------------------------------------------------------------
| UPDATE STUDENT
|--------------------------------------------------------------------------
| Admin and registrar can edit student information.
|--------------------------------------------------------------------------
*/
router.put(
  "/:id",
  authorizeRoles("admin", "registrar"),
  updateStudent
);

/*
|--------------------------------------------------------------------------
| UPDATE STUDENT STATUS
|--------------------------------------------------------------------------
| Example:
| PATCH /api/students/1/status
|
| Body:
| {
|   "status": "active"
| }
|
| or:
|
| {
|   "status": "inactive"
| }
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id/status",
  authorizeRoles("admin", "registrar"),
  updateStudentStatus
);

/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
| Permanent deletion is protected by the controller.
| Students with enrollment records cannot be deleted.
|--------------------------------------------------------------------------
*/
router.delete(
  "/:id",
  authorizeRoles("admin", "registrar"),
  deleteStudent
);

module.exports = router;