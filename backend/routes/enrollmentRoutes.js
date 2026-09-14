const express = require("express");

const {
  createEnrollment,
  getEnrollments,
} = require("../controllers/enrollmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
=========================================================
AUTHENTICATION
=========================================================
All enrollment routes require a logged-in user.
=========================================================
*/

router.use(authenticateToken);


/*
=========================================================
CREATE ENROLLMENT
=========================================================
Only Admin and Registrar can enroll students.
=========================================================
*/

router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  createEnrollment
);


/*
=========================================================
GET ENROLLMENTS
=========================================================
Admin and Registrar:
    Can view all enrollments.

Student:
    Can view their own enrollments.
=========================================================
*/

router.get(
  "/",
  authorizeRoles(
    "admin",
    "registrar",
    "student"
  ),
  getEnrollments
);


/*
=========================================================
EXPORT ROUTER
=========================================================
*/

module.exports = router;