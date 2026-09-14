const express = require("express");

const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  activateTeacher,
  deactivateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");

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
| CREATE TEACHER
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createTeacher
);

/*
|--------------------------------------------------------------------------
| GET ALL TEACHERS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authorizeRoles("admin", "registrar"),
  getTeachers
);

/*
|--------------------------------------------------------------------------
| GET ONE TEACHER
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  authorizeRoles("admin", "registrar"),
  getTeacherById
);

/*
|--------------------------------------------------------------------------
| UPDATE TEACHER
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  authorizeRoles("admin", "registrar"),
  updateTeacher
);

/*
|--------------------------------------------------------------------------
| ACTIVATE TEACHER
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/activate",
  authorizeRoles("admin", "registrar"),
  activateTeacher
);

/*
|--------------------------------------------------------------------------
| DEACTIVATE TEACHER
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/deactivate",
  authorizeRoles("admin", "registrar"),
  deactivateTeacher
);

/*
|--------------------------------------------------------------------------
| DELETE TEACHER
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  authorizeRoles("admin", "registrar"),
  deleteTeacher
);

module.exports = router;