const express = require("express");

const {
  createAcademicYear,
  getAcademicYears,
} = require("../controllers/academicYearController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  cacheResponse,
  invalidateCache,
} = require("../middleware/cacheMiddleware");

const router = express.Router();

router.use(authenticateToken);


/*
|--------------------------------------------------------------------------
| CREATE ACADEMIC YEAR
| POST /api/academic-years
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  invalidateCache("academic-years", "semesters"),
  createAcademicYear
);


/*
|--------------------------------------------------------------------------
| GET ALL ACADEMIC YEARS
| GET /api/academic-years
|
| Redis:
| First request  = MISS
| Later requests = HIT
| Cache lifetime = 5 minutes
|--------------------------------------------------------------------------
*/
router.get(
  "/",
  cacheResponse("academic-years", 300),
  getAcademicYears
);


module.exports = router;