const express = require("express");

const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  updateSubjectStatus,
  deleteSubject,
} = require("../controllers/subjectController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  cacheResponse,
  invalidateCache,
} = require("../middleware/cacheMiddleware");

const router = express.Router();

/*
=========================================================
ALL SUBJECT ROUTES REQUIRE AUTHENTICATION
=========================================================
*/
router.use(authenticateToken);


/*
=========================================================
GET ALL COURSE UNITS
GET /api/subjects

Redis cache:
- First request  = MISS
- Later requests = HIT
- Cache lifetime = 5 minutes
=========================================================
*/
router.get(
  "/",
  cacheResponse("subjects", 300),
  getSubjects
);


/*
=========================================================
GET ONE COURSE UNIT
GET /api/subjects/:id

Not cached yet.
=========================================================
*/
router.get(
  "/:id",
  getSubjectById
);


/*
=========================================================
CREATE COURSE UNIT
POST /api/subjects

Invalidate:
- subjects
- class-subjects
=========================================================
*/
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  invalidateCache("subjects", "class-subjects"),
  createSubject
);


/*
=========================================================
UPDATE COURSE UNIT
PUT /api/subjects/:id

Invalidate:
- subjects
- class-subjects
=========================================================
*/
router.put(
  "/:id",
  authorizeRoles("admin", "registrar"),
  invalidateCache("subjects", "class-subjects"),
  updateSubject
);


/*
=========================================================
ACTIVATE / DEACTIVATE COURSE UNIT
PATCH /api/subjects/:id/status

Invalidate:
- subjects
- class-subjects
=========================================================
*/
router.patch(
  "/:id/status",
  authorizeRoles("admin", "registrar"),
  invalidateCache("subjects", "class-subjects"),
  updateSubjectStatus
);


/*
=========================================================
DELETE COURSE UNIT
DELETE /api/subjects/:id

Invalidate:
- subjects
- class-subjects
=========================================================
*/
router.delete(
  "/:id",
  authorizeRoles("admin", "registrar"),
  invalidateCache("subjects", "class-subjects"),
  deleteSubject
);


module.exports = router;