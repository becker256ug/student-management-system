const express = require("express");

const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  activateClass,
  deactivateClass,
  deleteClass,
} = require("../controllers/classController");

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
| CREATE CLASS
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  authorizeRoles("admin", "registrar"),
  invalidateCache("classes", "class-subjects"),
  createClass
);


/*
|--------------------------------------------------------------------------
| GET ALL CLASSES
| GET /api/classes
|
| Redis:
| First request  = MISS
| Later requests = HIT
| Cache lifetime = 5 minutes
|--------------------------------------------------------------------------
*/
router.get(
  "/",
  authorizeRoles("admin", "registrar"),
  cacheResponse("classes", 300),
  getClasses
);


/*
|--------------------------------------------------------------------------
| GET ONE CLASS
| GET /api/classes/:id
|
| Not cached yet.
|--------------------------------------------------------------------------
*/
router.get(
  "/:id",
  authorizeRoles("admin", "registrar"),
  getClassById
);


/*
|--------------------------------------------------------------------------
| UPDATE CLASS
|--------------------------------------------------------------------------
*/
router.put(
  "/:id",
  authorizeRoles("admin", "registrar"),
  invalidateCache("classes", "class-subjects"),
  updateClass
);


/*
|--------------------------------------------------------------------------
| ACTIVATE CLASS
|--------------------------------------------------------------------------
*/
router.put(
  "/:id/activate",
  authorizeRoles("admin", "registrar"),
  invalidateCache("classes", "class-subjects"),
  activateClass
);


/*
|--------------------------------------------------------------------------
| DEACTIVATE CLASS
|--------------------------------------------------------------------------
*/
router.put(
  "/:id/deactivate",
  authorizeRoles("admin", "registrar"),
  invalidateCache("classes", "class-subjects"),
  deactivateClass
);


/*
|--------------------------------------------------------------------------
| DELETE CLASS
|--------------------------------------------------------------------------
*/
router.delete(
  "/:id",
  authorizeRoles("admin", "registrar"),
  invalidateCache("classes", "class-subjects"),
  deleteClass
);


module.exports = router;