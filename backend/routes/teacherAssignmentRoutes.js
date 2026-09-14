const express = require("express");

const {
  createTeacherAssignment,
  getTeacherAssignments,
  getTeacherAssignmentById,
  updateTeacherAssignment,
  activateTeacherAssignment,
  deactivateTeacherAssignment,
  deleteTeacherAssignment,
} = require("../controllers/teacherAssignmentController");

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
| CREATE ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createTeacherAssignment
);


/*
|--------------------------------------------------------------------------
| GET ALL ASSIGNMENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authorizeRoles(
    "admin",
    "registrar",
    "teacher"
  ),
  getTeacherAssignments
);


/*
|--------------------------------------------------------------------------
| GET ONE ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  authorizeRoles(
    "admin",
    "registrar",
    "teacher"
  ),
  getTeacherAssignmentById
);


/*
|--------------------------------------------------------------------------
| UPDATE ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  authorizeRoles(
    "admin",
    "registrar"
  ),
  updateTeacherAssignment
);


/*
|--------------------------------------------------------------------------
| ACTIVATE ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/activate",
  authorizeRoles(
    "admin",
    "registrar"
  ),
  activateTeacherAssignment
);


/*
|--------------------------------------------------------------------------
| DEACTIVATE ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/deactivate",
  authorizeRoles(
    "admin",
    "registrar"
  ),
  deactivateTeacherAssignment
);


/*
|--------------------------------------------------------------------------
| DELETE ASSIGNMENT
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  authorizeRoles(
    "admin",
    "registrar"
  ),
  deleteTeacherAssignment
);


module.exports = router;